import { NextRequest, NextResponse } from 'next/server';
import { MemoryClient } from 'mem0ai';

const client = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY || ''
});

export async function POST(request: NextRequest) {
  console.log('=== MEM0 API ROUTE HIT ===');
  try {
    const { action, messages, userId, runId, filters } = await request.json();
    console.log('Request body:', { action, messages, userId, runId, filters });

    switch (action) {
      case 'save':
        // Save messages to Mem0 - messages should be an array
        console.log('Saving messages:', messages);
        console.log('User ID:', userId);
        console.log('Run ID:', runId);
        const response = await client.add(messages, {
          user_id: userId,
          run_id: runId
        });
        console.log('Save response:', response);
        return NextResponse.json({ success: true, data: response });

      case 'load':
        // Load messages from Mem0
        console.log('Loading with filters:', filters);
        console.log('Filter type:', typeof filters);
        console.log('Filter keys:', Object.keys(filters || {}));
        
        // Try different approaches to load memories
        let memories;
        try {
          // First try with the provided filters
          memories = await client.getAll(filters);
          console.log('Load response with filters:', memories);
        } catch (error) {
          console.log('Error with filters, trying with empty object:', error);
          // If that fails, try with empty object
          memories = await client.getAll({});
          console.log('Load response with empty object:', memories);
        }
        
        console.log('Memories count:', memories?.length || 0);
        return NextResponse.json({ success: true, data: memories });

      case 'search':
        // Search messages in Mem0
        const searchResults = await client.search({
          query: filters.query,
          filters: filters.filters
        });
        return NextResponse.json({ success: true, data: searchResults });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Mem0 API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
