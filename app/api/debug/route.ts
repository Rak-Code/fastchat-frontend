import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/config"

const BACKEND_URL = getBackendUrl()

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    backendUrl: BACKEND_URL,
    envVars: {
      BACKEND_URL: process.env.BACKEND_URL || 'not set',
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'not set',
    },
    userAgent: 'server-side-check'
  }

  try {
    // Test backend connectivity
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'FastChat-Frontend-Debug',
      },
    })

    const healthData = healthResponse.ok ? await healthResponse.json() : null

    return NextResponse.json({
      ...debugInfo,
      backendHealth: {
        status: healthResponse.status,
        statusText: healthResponse.statusText,
        ok: healthResponse.ok,
        data: healthData,
      }
    })
  } catch (error) {
    return NextResponse.json({
      ...debugInfo,
      backendHealth: {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    })
  }
}