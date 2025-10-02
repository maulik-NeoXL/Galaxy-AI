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
        console.log('Message format:', messages.map(m => ({ role: m.role, contentLength: m.content.length })));
        
        try {
          const response = await client.add(messages, {
            user_id: userId,
            run_id: runId
          });
          console.log('Save response:', response);
          console.log('Save successful - memories created:', response?.length || 0);
          return NextResponse.json({ success: true, data: response });
        } catch (error) {
          console.error('Save error:', error);
          return NextResponse.json({ error: 'Failed to save memories' }, { status: 500 });
        }

      case 'load':
        // Load messages from Mem0
        console.log('Loading with filters:', filters);
        console.log('Filter type:', typeof filters);
        console.log('Filter keys:', Object.keys(filters || {}));
        
        let memories;
        try {
          const searchFilters = filters || {};
          
          if (searchFilters.run_id) {
            // If we have run_id (specific chat), get memories from that chat
            console.log('Loading memories for specific chat:', searchFilters.run_id);
            memories = await client.getAll(searchFilters);
          } else if (searchFilters.user_id) {
            // For cross-chat memory, we need to get memories from multiple chats
            // Since Mem0 requires run_id, we'll get memories from the most recent chats
            console.log('Loading cross-chat memories for user:', searchFilters.user_id);
            
            // Try to load memories from recent chats (this is a limitation of Mem0)
            // For now, return empty array - use simple memory for cross-chat
            memories = [];
            console.log('Cross-chat memory not supported by Mem0 - use simple memory instead');
          } else {
            // No valid filters
            memories = [];
            console.log('No valid filters provided');
          }
          
          console.log('Load response with filters:', memories);
          console.log('Memories count:', memories?.length || 0);
        } catch (error) {
          console.log('Error loading memories:', error);
          memories = []; // Return empty array on error
        }
        
        return NextResponse.json({ success: true, data: memories });

      case 'search':
        // Search messages in Mem0
        const searchResults = await client.search(filters.query);
        return NextResponse.json({ success: true, data: searchResults });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Mem0 API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
