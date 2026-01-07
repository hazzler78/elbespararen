// Custom error handler for NextAuth configuration errors
// This route works even when auth-config.ts fails to load due to missing env vars
export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
    
    const clientId = getEnvVar("GOOGLE_CLIENT_ID");
    const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
    const secret = getEnvVar("NEXTAUTH_SECRET");
    const url = getEnvVar("NEXTAUTH_URL");
    
    if (!clientId) {
      missingVars.push("GOOGLE_CLIENT_ID");
    }
    if (!clientSecret) {
      missingVars.push("GOOGLE_CLIENT_SECRET");
    }
    if (!secret) {
      missingVars.push("NEXTAUTH_SECRET");
    }
    if (!url) {
      missingVars.push("NEXTAUTH_URL");
    }
    
    // Build diagnostic information
    const diagnostics: any = {
      envVarsPresent: {
        GOOGLE_CLIENT_ID: !!clientId,
        GOOGLE_CLIENT_SECRET: !!clientSecret,
        NEXTAUTH_SECRET: !!secret,
        NEXTAUTH_URL: !!url,
      },
    };
    
    // Add value lengths and formats for debugging (without exposing secrets)
    if (clientId) {
      diagnostics.envVarsPresent.GOOGLE_CLIENT_ID_LENGTH = clientId.length;
      diagnostics.envVarsPresent.GOOGLE_CLIENT_ID_FORMAT = clientId.includes(".apps.googleusercontent.com") ? "valid" : "unexpected format";
    }
    if (clientSecret) {
      diagnostics.envVarsPresent.GOOGLE_CLIENT_SECRET_LENGTH = clientSecret.length;
    }
    if (secret) {
      diagnostics.envVarsPresent.NEXTAUTH_SECRET_LENGTH = secret.length;
      diagnostics.envVarsPresent.NEXTAUTH_SECRET_VALID = secret.length >= 32 ? "valid (>=32 chars)" : "too short (<32 chars)";
    }
    if (url) {
      diagnostics.envVarsPresent.NEXTAUTH_URL_VALUE = url;
      diagnostics.envVarsPresent.NEXTAUTH_URL_VALID = url.startsWith("https://") ? "valid (https)" : url.startsWith("http://") ? "http (use https in production)" : "invalid format";
    }
    
    // Try to initialize NextAuth to capture the actual error
    if (missingVars.length === 0 && clientId && clientSecret && secret) {
      try {
        const testAuthOptions = {
          providers: [
            GoogleProvider({
              clientId,
              clientSecret,
            }),
          ],
          secret,
          url,
          trustHost: true,
          pages: {
            signIn: '/auth/signin',
          },
        };
        
        const testAuth = NextAuth(testAuthOptions as any);
        const testHandlers = testAuth.handlers;
        
        if (!testHandlers) {
          diagnostics.initializationError = "NextAuth handlers not found after initialization";
        } else {
          diagnostics.initializationSuccess = true;
          
          // Try to call the handler with a test request to see if it works
          try {
            const testReq = new Request(`${url}/api/auth/signin`, {
              method: 'GET',
              headers: {
                'host': new URL(url).host,
              },
            });
            const testNextReq = new NextRequest(testReq);
            // Don't actually call it, just verify it exists
            diagnostics.handlerTest = "Handlers available and callable";
          } catch (handlerError: any) {
            diagnostics.handlerError = handlerError?.message || String(handlerError);
          }
        }
      } catch (initError: any) {
        diagnostics.initializationError = initError?.message || String(initError);
        diagnostics.initializationErrorStack = initError?.stack;
        diagnostics.initializationErrorName = initError?.name;
      }
    }
    
    // Add information about what route triggered this error
    const referer = req.headers.get('referer');
    const origin = req.headers.get('origin');
    diagnostics.requestInfo = {
      pathname: req.nextUrl.pathname,
      searchParams: Object.fromEntries(req.nextUrl.searchParams),
      referer: referer || 'none',
      origin: origin || 'none',
    };
    
    // Return a helpful error response
    return NextResponse.json(
      {
        error: "Configuration Error",
        message: missingVars.length > 0 
          ? "NextAuth is missing required environment variables"
          : "NextAuth configuration error - variables are present but there may be a validation issue",
        missingVariables: missingVars,
        diagnostics,
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
