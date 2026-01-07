import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getSessionUser(req: NextRequest) {
  try {
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token || !token.email) {
      return null;
    }
    
    return {
      id: token.sub || (token.id as string) || '',
      email: token.email as string,
      name: token.name as string | undefined,
      image: token.picture as string | undefined,
    };
  } catch (error) {
    console.error("[auth] Error getting session user:", error);
    // Return null instead of throwing - allows routes to continue without auth
    return null;
  }
}
