import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/user.model";
import { UserJSON } from "@clerk/nextjs/server";
import { ClerkEventPayload, DeletedObjectJSON } from "@clerk/types";
import { logger } from "@/lib/logger";
import { dbConnect } from "@/lib/dbConnect";




export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET_KEY;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET_KEY is not set");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const headersPayload = headers();
  const svixId = (await headersPayload).get("svix-id")
  const svixTimestamp = (await headersPayload).get("svix-timestamp")
  const svixSignature = (await headersPayload).get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing Svix headers: svix-id, svix-timestamp, or svix-signature");
    return new NextResponse("Missing Svix headers", { status: 400 });
  }

  let payload: ClerkEventPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return new NextResponse("Invalid request body", { status: 400 });
  }

  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(JSON.stringify(payload), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new NextResponse("Webhook verification failed", { status: 400 });
  }

  await dbConnect()

  try {
    switch (event.type) {
      case "user.created":
        await handleUserCreated(event.data);
        break;
      case "user.updated":
        await handleUserUpdated(event.data);
        break;
      case "user.deleted":
        await handleUserDeleted(event.data);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse(`Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

async function handleUserCreated(data: UserJSON) {
  const emailAddresses = data.email_addresses.map((email) => ({
    email: email.email_address,
    verified: email.verification?.status === "verified",
    primary: email.id === data.primary_email_address_id,
  }));

  const primaryEmail = emailAddresses.find(email => email.primary)?.email ||
    emailAddresses[0]?.email ||
    null;

  const user = await User.create({
    clerkId: data.id,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    fullName: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
    email: primaryEmail,
    emailAddresses,
    profileImageUrl: data.image_url,
    lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  });

  console.log("User created:", user._id);
}

async function handleUserUpdated(data: UserJSON) {
  const emailAddresses = data.email_addresses.map(email => ({
    email: email.email_address,
    verified: email.verification?.status === "verified",
    primary: email.id === data.primary_email_address_id,
  }));

  const primaryEmail = emailAddresses.find(email => email.primary)?.email ||
    emailAddresses[0]?.email ||
    null;

  const user = await User.findOneAndUpdate(
    { clerkId: data.id },
    {
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      fullName: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
      email: primaryEmail,
      emailAddresses,
      profileImageUrl: data.image_url,
      lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : null,
      updatedAt: new Date(data.updated_at),
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    console.warn(`User not found for update: ${data.id}`);
    throw new Error("User not found");
  }

  console.log("User updated:", user._id);
}

async function handleUserDeleted(data: DeletedObjectJSON) {
  // For deletion, we either soft delete or actually delete based on your preference
  const user = await User.findOneAndDelete({ clerkId: data.id });
  if (!user) {
    console.warn(`User not found for deletion: ${data.id}`);
    logger.error("Failed to delete user", {
      error: 'Failed to delete user',
      clerkId: data.id
    });
    throw new Error("User not found");
  }

  console.log("User deleted:", data.id);
}