/**
 * Backend connectivity testing utilities
 */

import { getBackendUrl } from './config'

export interface BackendHealthCheck {
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime?: number
  statusCode?: number
  error?: string
  data?: any
}

/**
 * Test backend health endpoint
 */
export async function testBackendHealth(): Promise<BackendHealthCheck> {
  const backendUrl = getBackendUrl()
  const startTime = Date.now()

  try {
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'FastChat-Frontend-Test',
        'Content-Type': 'application/json',
      },
    })

    const responseTime = Date.now() - startTime
    const data = await response.json().catch(() => null)

    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime,
      statusCode: response.status,
      data,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test a simple chat request
 */
export async function testChatEndpoint(testMessage = "Hello, this is a test message"): Promise<BackendHealthCheck> {
  const backendUrl = getBackendUrl()
  const startTime = Date.now()
  const testConversationId = `test-${Date.now()}`

  try {
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FastChat-Frontend-Test',
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        message: testMessage,
      }),
    })

    const responseTime = Date.now() - startTime
    const data = await response.json().catch(() => null)

    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime,
      statusCode: response.status,
      data,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Run a comprehensive backend test
 */
export async function runBackendDiagnostics() {
  console.log('🔍 Running backend diagnostics...')
  
  const results = {
    backendUrl: getBackendUrl(),
    timestamp: new Date().toISOString(),
    tests: {} as Record<string, BackendHealthCheck>,
  }

  // Test health endpoint
  console.log('Testing health endpoint...')
  results.tests.health = await testBackendHealth()

  // Test chat endpoint if health is good
  if (results.tests.health.status === 'healthy') {
    console.log('Testing chat endpoint...')
    results.tests.chat = await testChatEndpoint()
  }

  // Log results
  console.log('📊 Diagnostics Results:')
  console.table(results.tests)

  return results
}