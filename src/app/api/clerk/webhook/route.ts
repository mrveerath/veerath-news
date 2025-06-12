import { WebhookEvent } from "@clerk/nextjs/server"
import { Webhook } from "svix"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
// import { User } from "@/models/author.mode"

export async function POST(req: NextRequest) {
    // Get webhook secret from environment variables
    const web_hook_secret = process.env.CLERK_WEBHOOK_SECRET_KEY
    if (!web_hook_secret) {
        return new NextResponse("Webhook secret not configured", { status: 500 })
    }

    // Get Svix headers
    const header_payload = headers()
    const svix_id = (await header_payload).get("svix-id")
    const svix_timestamp = (await header_payload).get("svix-timestamp")
    const svix_signature = (await header_payload).get("svix-signature")

    // Validate headers
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new NextResponse("Missing Svix headers", { status: 400 })
    }

    // Get and parse request body
    let payload: any
    try {
        payload = await req.json()
    } catch (error) {
        return new NextResponse("Invalid request body", { status: 400 })
    }

    const body = JSON.stringify(payload)

    // Verify webhook signature
    const wh = new Webhook(web_hook_secret)
    let event: WebhookEvent

    try {
        event = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        }) as WebhookEvent
    } catch (error) {
        console.error("Webhook verification failed:", error)
        return new NextResponse("Webhook verification failed", { status: 400 })
    }

    // Process different event types
    try {
        switch (event.type) {
            case "user.created":
                // Handle user created event
                console.log("User created:", event.data)
                // Add your logic here (e.g., save to database, send notification)
                break

            case "user.updated":
                // Handle user updated event
                console.log("User updated:", event.data)
                // Add your logic here
                break

            case "user.deleted":
                // Handle user deleted event
                console.log("User deleted:", event.data)
                // Add your logic here
                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        // Return success response
        return new NextResponse(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        })

    } catch (error) {
        console.error("Error processing webhook:", error)
        return new NextResponse("Error processing webhook", { status: 500 })
    }
}