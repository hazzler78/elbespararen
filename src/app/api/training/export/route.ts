import { NextResponse } from 'next/server';
import { exportTrainingData } from '@/lib/server-database';

export async function GET() {
  try {
    const data = await exportTrainingData();
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('[Training Export] Fel:', error);
    return NextResponse.json({
      success: false,
      error: 'Fel vid export av träningsdata'
    }, { status: 500 });
  }
}
