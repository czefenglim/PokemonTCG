/**
 * Environment variables validation and setup for PvE system
 * Ensures all required environment variables are present
 */

// Required environment variables
const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
} as const;

/**
 * Validate that all required environment variables are present
 */
export function validateEnvironment(): void {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }

  console.log('✅ Environment variables validated successfully');
}

/**
 * Get environment variables (validated)
 */
export function getEnv() {
  validateEnvironment();
  return requiredEnvVars;
}

/**
 * Auto-validate environment on import (except in test environment)
 */
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    // Don't throw in production to prevent crashes, just warn
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }
}
