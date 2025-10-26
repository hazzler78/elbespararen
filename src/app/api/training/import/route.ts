import { NextRequest, NextResponse } from 'next/server';
import { importTrainingData } from '@/lib/server-database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    await importTrainingData(data);
    
    return NextResponse.json({
      success: true,
      message: 'Träningsdata importerad'
    });
  } catch (error) {
    console.error('[Training Import] Fel:', error);
    return NextResponse.json({
      success: false,
      error: 'Fel vid import av träningsdata'
    }, { status: 500 });
  }
}
