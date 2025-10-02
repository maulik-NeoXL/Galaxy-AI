import { NextRequest, NextResponse } from 'next/server';

// Simple memory storage (fallback when Mem0 isn't working)
interface Memory {
  id: string;
  user_id: string;
  memory: string;
  timestamp: number;
  chat_id?: string;
}

// In-memory storage (would use Redis/DB in production)
let memoryStore: Memory[] = [];

function generateMemory(messages: any[]): string[] {
  const memories: string[] = [];
  
  messages.forEach((msg, index) => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      
      // Extract personal information
      if (content.includes('my name is ')) {
        const name = content.match(/my name is ([^.]+)/)?.[1]?.trim();
        if (name) memories.push(`User's name is ${name}`);
      }
      
      if (content.includes('i live in ')) {
        const location = content.match(/i live in ([^.]+)/)?.[1]?.trim();
        if (location) memories.push(`User lives in ${location}`);
      }
      
      if (content.includes('i am ') || content.includes('i\'m ')) {
        const description = content.match(/(?:i am|i'm) ([^.]+)/)?.[1]?.trim();
        if (description && !description.includes('fine') && !description.includes('good')) {
          memories.push(`User is ${description}`);
        }
      }
      
      if (content.includes('my favorite') || content.includes('i like')) {
        const preference = content.match(/(?:my favorite|i like) ([^.]+)/)?.[1]?.trim();
        if (preference) memories.push(`User's preference: ${preference}`);
      }
      
      // Extract other personal facts
      if (content.includes('work') && content.includes('as')) {
        const job = content.match(/work as ([^.]+)/)?.[1]?.trim();
        if (job) memories.push(`User works as ${job}`);
      }
      
      if (content.includes('study') || content.includes('going to school')) {
        const education = content.match(/(?:study|going to school)[s]* ([^.]+)/)?.[1]?.trim();
        if (education) memories.push(`User studies ${education}`);
      }
    }
  });
  
  return memories;
}

export async function POST(request: NextRequest) {
  try {
    const { action, messages, userId, runId } = await request.json();
    console.log('Simple Memory API:', { action, userId, runId, messagesCount: messages?.length });

    switch (action) {
      case 'save':
        console.log('Saving to simple memory...');
        const memories = generateMemory(messages);
        
        memories.forEach(memory => {
          const existingIndex = memoryStore.findIndex(
            m => m.memory === memory && m.user_id === userId
          );
          
          if (existingIndex >= 0) {
            // Update existing memory
            memoryStore[existingIndex].timestamp = Date.now();
          } else {
            // Add new memory
            memoryStore.push({
              id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: userId,
              memory: memory,
              timestamp: Date.now(),
              chat_id: runId
            });
          }
        });
        
        console.log('Simple memory save successful:', memories);
        console.log('Total memory count:', memoryStore.length);
        return NextResponse.json({ success: true, saved: memories });

      case 'load':
        console.log('Loading from simple memory...');
        const userMemories = memoryStore.filter(m => m.user_id === userId);
        console.log(`Found ${userMemories.length} memories for user ${userId}`);
        
        return NextResponse.json({ 
          success: true, 
          data: userMemories.map(m => ({
            memory: m.memory,
            timestamp: m.timestamp
          }))
        });

      case 'clear':
        memoryStore = memoryStore.filter(m => m.user_id !== userId);
        return NextResponse.json({ success: true, message: 'Memory cleared' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Simple Memory API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Simple Memory API',
    memoryCount: memoryStore.length,
    examples: memoryStore.slice(0, 3)
  });
}
