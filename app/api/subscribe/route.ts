import { NextResponse } from "next/server"
import { recordUpdatesSignup } from "@/lib/reservations/service"

export async function POST(request: Request) {
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
  }
  const { email, visitorId, attemptId } = body || {}

  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
  }

  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY
  const MAILCHIMP_API_SERVER = process.env.MAILCHIMP_API_SERVER
  const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID

  if (!MAILCHIMP_API_KEY || !MAILCHIMP_API_SERVER || !MAILCHIMP_AUDIENCE_ID) {
    return NextResponse.json({ error: "Mailchimp configuration is missing" }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://${MAILCHIMP_API_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
        }),
      },
    )

    const data = await response.json()

    if (response.ok) {
      // Count only successful subscriptions. A missing analytics database must
      // never turn an already successful Mailchimp signup into an error.
      try { await recordUpdatesSignup({ visitorId, attemptId }) } catch { /* Best effort. */ }
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: data.detail }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
