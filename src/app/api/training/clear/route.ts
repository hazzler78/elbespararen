import { NextResponse } from 'next/server';
import { clearTrainingData } from '@/lib/server-database';

export const runtime = 'edge';

export async function POST() {
  try {
    await clearTrainingData();
    
    return NextResponse.json({
      success: true,
      message: 'All träningsdata rensad'
    });
  } catch (error) {
    console.error('[Training Clear] Fel:', error);
    return NextResponse.json({
      success: false,
      error: 'Fel vid rensning av träningsdata'
    }, { status: 500 });
  }
}
