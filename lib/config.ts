/**
 * Configuration utilities for FastChat frontend
 */

/**
 * Get the backend URL based on the current environment
 * 
 * Environment priority:
 * - Production: NEXT_PUBLIC_BACKEND_URL > BACKEND_URL > fallback to production URL
 * - Development: BACKEND_URL > NEXT_PUBLIC_BACKEND_URL > fallback to localhost
 */
export function getBackendUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return (
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.BACKEND_URL || 
      'https://fastchat-backend-xujp.onrender.com'
    )
  }
  
  // Development environment
  return (
    process.env.BACKEND_URL || 
    process.env.NEXT_PUBLIC_BACKEND_URL || 
    'http://localhost:8080'
  )
}

/**
 * Debug logging for environment configuration (only in development)
 */
export function logEnvironmentConfig(context: string = 'config'): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${context}] Environment:`, process.env.NODE_ENV)
    console.log(`[${context}] Backend URL:`, getBackendUrl())
    console.log(`[${context}] NEXT_PUBLIC_BACKEND_URL:`, process.env.NEXT_PUBLIC_BACKEND_URL)
    console.log(`[${context}] BACKEND_URL:`, process.env.BACKEND_URL)
  }
}

/**
 * Environment configuration constants
 */
export const CONFIG = {
  BACKEND_URL: getBackendUrl(),
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const