// Custom error handler for NextAuth configuration errors
// This route works even when auth-config.ts fails to load due to missing env vars
export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error") || "Unknown";
  
  // Check if this is a configuration error
  if (error === "Configuration") {
    // Check which environment variables are missing
    const missingVars: string[] = [];
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      missingVars.push("GOOGLE_CLIENT_ID");
    }
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      missingVars.push("GOOGLE_CLIENT_SECRET");
    }
    if (!process.env.NEXTAUTH_SECRET) {
      missingVars.push("NEXTAUTH_SECRET");
    }
    if (!process.env.NEXTAUTH_URL) {
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
