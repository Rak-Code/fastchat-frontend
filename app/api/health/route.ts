import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`)
    const data = await response.json()

    return NextResponse.json({
      status: "ok",
      backend: data,
    })
  } catch (error) {
    console.error("Error checking health:", error)
    return NextResponse.json({ status: "error", error: "Backend unavailable" }, { status: 503 })
  }
}
