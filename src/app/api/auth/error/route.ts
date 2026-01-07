// Custom error handler for NextAuth configuration errors
// This route works even when auth-config.ts fails to load due to missing env vars
export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";

// Helper function to get environment variable (works in both Node and Edge runtime)
function getEnvVar(key: string): string | undefined {
  // Try process.env first (works in both Node and Edge runtime)
  const fromProcess = (process.env as any)?.[key];
  if (typeof fromProcess === "string" && fromProcess.length > 0) return fromProcess;
  
  // Try getRequestContext (next-on-pages for Cloudflare Pages)
  try {
    const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
    if (ctxEnv && typeof ctxEnv[key] === "string" && ctxEnv[key]) {
      return ctxEnv[key] as string;
    }
  } catch (e) {
    // getRequestContext might not be available or might throw
  }
  
  // Try globalThis.env (Cloudflare Workers)
  try {
    const workerEnv = (globalThis as any).env;
    if (workerEnv && typeof workerEnv[key] === "string" && workerEnv[key]) {
      return workerEnv[key] as string;
    }
  } catch (e) {
    // globalThis.env might not be available
  }
  
  return undefined;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error") || "Unknown";
  
  // Check if this is a configuration error
  if (error === "Configuration") {
    // Check which environment variables are missing (check at request time for Edge runtime)
    const missingVars: string[] = [];
    
    if (!getEnvVar("GOOGLE_CLIENT_ID")) {
      missingVars.push("GOOGLE_CLIENT_ID");
    }
    if (!getEnvVar("GOOGLE_CLIENT_SECRET")) {
      missingVars.push("GOOGLE_CLIENT_SECRET");
    }
    if (!getEnvVar("NEXTAUTH_SECRET")) {
      missingVars.push("NEXTAUTH_SECRET");
    }
    if (!getEnvVar("NEXTAUTH_URL")) {
      missingVars.push("NEXTAUTH_URL");
    }
    
    // Return a helpful error response
    return NextResponse.json(
      {
        error: "Configuration Error",
        message: "NextAuth is missing required environment variables",
        missingVariables: missingVars,
        help: "Please check your Cloudflare Pages environment variables and ensure all required variables are set for the Production environment.",
        requiredVariables: [
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET", 
          "NEXTAUTH_SECRET",
          "NEXTAUTH_URL"
        ]
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
  
  // Handle other error types
  return NextResponse.json(
    {
      error: error,
      message: "An authentication error occurred"
    },
    { 
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
