import { NextRequest, NextResponse } from 'next/server';
import { MemoryClient } from 'mem0ai';

console.log('🔑 MEM0_API_KEY exists:', !!process.env.MEM0_API_KEY);
console.log('🔑 MEM0_API_KEY length:', process.env.MEM0_API_KEY?.length || 0);

const client = process.env.MEM0_API_KEY 
  ? new MemoryClient({
      apiKey: process.env.MEM0_API_KEY
    })
  : null;

console.log('🤖 Mem0 client initialized:', !!client);

export async function POST(request: NextRequest) {
  console.log('=== MEM0 API ROUTE HIT ===');
  
  // Temporarily disable Mem0 due to API issues
  console.log('⚠️ Mem0 temporarily disabled - using Simple Memory instead');
  return NextResponse.json({
    success: false,
    error: 'Mem0 temporarily disabled - using Simple Memory instead',
    data: []
  });
}
