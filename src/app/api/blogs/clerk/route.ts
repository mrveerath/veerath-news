import User from "@/model"
import { dbConnect } from "@/lib/dbConnect";
import { Webhook } from "svix";
import { NextResponse } from "next/server";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature || !WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Missing webhook headers or secret" }, { status: 400 });
    }

    const payload = await request.text();
    const webhook = new Webhook(WEBHOOK_SECRET);
    webhook.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });

    const event = JSON.parse(payload);
    if (event.type !== "user.updated") {
      return NextResponse.json({ success: true, message: "Event ignored" });
    }

    const userData = event.data;
    await dbConnect();

    // Update User schema
    await User.findOneAndUpdate(
      { clerkId: userData.id },
      {
        $set: {
          username: userData.username || null,
          fullName: userData.full_name || null,
          emailAddress: userData.email_addresses[0]?.email_address || "",
          imageUrl: userData.image_url || null,
          publicMetadata: userData.public_metadata || {},
          unsafeMetadata: userData.unsafe_metadata || {},
          lastSignInAt: userData.last_sign_in_at ? new Date(userData.last_sign_in_at) : null,
          deletedAt: null,
        },
      },
      { upsert: true, new: true }
    );

    // Log update (extend for notifications)
    console.log(`User updated: ${userData.id}, Email: ${userData.email_addresses[0]?.email_address}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: error.message.includes("signature") ? 401 : 500 });
  }
}