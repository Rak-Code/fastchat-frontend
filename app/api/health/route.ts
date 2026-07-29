import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/config"

const BACKEND_URL = getBackendUrl()

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`)
    const data = await response.json()

    return NextResponse.json({
      status: "ok",
      backend: data,
    })
  } catch (error: unknown) {
    console.error("Error checking health:", error)
    return NextResponse.json({ status: "error", error: "Backend unavailable" }, { status: 503 })
  }
}
