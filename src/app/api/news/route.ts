import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import type { NewsPost, ApiResponse } from "@/lib/types";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Hämta D1-binding från Edge-runtime - flera metoder för Cloudflare Pages
    let env: any = {};
    
    // Metod 1: getRequestContext (next-on-pages)
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    
    // Metod 2: process.env.DB (direkt access)
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    
    // Metod 3: globalThis.env (Cloudflare Workers)
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }
    
    console.log('[news] GET - env:', env);
    console.log('[news] GET - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    
    // Kontrollera om vi ska inkludera opublicerade inlägg
    const url = new URL(request.url);
    const includeUnpublished = url.searchParams.get('includeUnpublished') === 'true';
    const id = url.searchParams.get('id');
    
    if (id) {
      // Hämta ett specifikt inlägg
      const post = await db.getNewsPost(id);
      if (!post) {
        return NextResponse.json(
          { success: false, error: "Nyhetsinlägg hittades inte" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: post
      } as ApiResponse<NewsPost>);
    }
    
    const posts = await db.getNewsPosts(includeUnpublished);
    
    return NextResponse.json({
      success: true,
      data: posts
    } as ApiResponse<NewsPost[]>);
  } catch (error) {
    console.error("[news] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta nyhetsinlägg" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Hämta D1-binding från Edge-runtime
    let env: any = {};
    
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }
    
    console.log('[news] POST - env:', env);
    console.log('[news] POST - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    const body = await request.json() as Record<string, unknown>;
    
    // Validera obligatoriska fält
    const requiredFields = ['title', 'content'];
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
        return NextResponse.json(
          { success: false, error: `Fält ${field} är obligatoriskt` },
          { status: 400 }
        );
      }
    }

    const newPost = await db.createNewsPost({
      title: String(body.title),
      excerpt: body.excerpt ? String(body.excerpt) : undefined,
      content: String(body.content),
      imageUrl: body.imageUrl ? String(body.imageUrl) : undefined,
      externalLink: body.externalLink ? String(body.externalLink) : undefined,
      publishedAt: body.publishedAt ? new Date(String(body.publishedAt)) : new Date(),
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true
    });

    return NextResponse.json({
      success: true,
      data: newPost
    } as ApiResponse<NewsPost>);
  } catch (error) {
    console.error("[news] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte skapa nyhetsinlägg" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Hämta D1-binding från Edge-runtime
    let env: any = {};
    
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }
    
    console.log('[news] PUT - env:', env);
    console.log('[news] PUT - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    const body = await request.json() as Record<string, unknown>;
    
    const id = body.id as string;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID är obligatoriskt" },
        { status: 400 }
      );
    }

    const updateData: Partial<NewsPost> = {};
    if (body.title !== undefined) updateData.title = String(body.title);
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt ? String(body.excerpt) : undefined;
    if (body.content !== undefined) updateData.content = String(body.content);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? String(body.imageUrl) : undefined;
    if (body.externalLink !== undefined) updateData.externalLink = body.externalLink ? String(body.externalLink) : undefined;
    if (body.publishedAt !== undefined) updateData.publishedAt = new Date(String(body.publishedAt));
    if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished);

    const updatedPost = await db.updateNewsPost(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedPost
    } as ApiResponse<NewsPost>);
  } catch (error) {
    console.error("[news] PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte uppdatera nyhetsinlägg" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Hämta D1-binding från Edge-runtime
    let env: any = {};
    
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }
    
    console.log('[news] DELETE - env:', env);
    console.log('[news] DELETE - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID är obligatoriskt" },
        { status: 400 }
      );
    }

    const success = await db.deleteNewsPost(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Nyhetsinlägg hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Nyhetsinlägg borttaget"
    });
  } catch (error) {
    console.error("[news] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte ta bort nyhetsinlägg" },
      { status: 500 }
    );
  }
}

