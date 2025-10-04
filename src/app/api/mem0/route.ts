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
  
  if (!client) {
    console.log('⚠️ Mem0 client not initialized - missing MEM0_API_KEY');
    return NextResponse.json({
      success: false,
      error: 'Mem0 not configured - missing API key',
      data: []
    });
  }
  
  try {
    const { action, messages, userId, runId, filters } = await request.json();
    console.log('Request body:', { action, messages, userId, runId, filters });

    switch (action) {
      case 'save':
        // Save messages to Mem0 - messages should be an array
        console.log('Saving messages:', messages);
        console.log('User ID:', userId);
        console.log('Run ID:', runId);
        console.log('Message format:', messages.map((m: {role: string, content: string}) => ({ role: m.role, contentLength: m.content.length })));
        
        try {
          console.log('🚀 Attempting to save to Mem0 with:', {
            messagesCount: messages.length,
            userId,
            runId
          });
          
          // Try different approaches to save memories
          let response: any[] = [];
          
          // Approach 1: Try with individual messages using new API format
          try {
            console.log('🔄 Trying individual message approach...');
            response = await client.add(messages, {
              user_id: userId,
              run_id: runId
            });
            console.log('✅ Individual message approach response:', response);
          } catch (individualError: any) {
            console.log('❌ Individual message approach failed:', individualError.message);
            
            // Approach 2: Try with single content string
            try {
              console.log('🔄 Trying single content string approach...');
              const content = messages.map((m: {role: string, content: string}) => `${m.role}: ${m.content}`).join('\n');
              response = await client.add(content, {
                user_id: userId,
                run_id: runId
              });
              console.log('✅ Single content string approach response:', response);
            } catch (singleContentError: any) {
              console.log('❌ Single content string approach failed:', singleContentError.message);
              
              // Approach 3: Try with just user messages
              try {
                console.log('🔄 Trying user messages only approach...');
                const userMessages = messages.filter((m: {role: string, content: string}) => m.role === 'user');
                if (userMessages.length > 0) {
                  response = await client.add(userMessages, {
                    user_id: userId,
                    run_id: runId
                  });
                  console.log('✅ User messages only approach response:', response);
                } else {
                  response = [];
                  console.log('⚠️ No user messages to save');
                }
              } catch (userOnlyError: any) {
                console.log('❌ User messages only approach failed:', userOnlyError.message);
                
                // Approach 4: Try with minimal parameters
                try {
                  console.log('🔄 Trying minimal parameters approach...');
                  const firstMessage = messages[0];
                  if (firstMessage) {
                    response = await client.add(firstMessage.content, {
                      user_id: userId
                    });
                    console.log('✅ Minimal parameters approach response:', response);
                  } else {
                    response = [];
                    console.log('⚠️ No messages to save');
                  }
                } catch (minimalError: any) {
                  console.log('❌ Minimal parameters approach failed:', minimalError.message);
                  throw minimalError;
                }
              }
            }
          }
          
          console.log('✅ Mem0 save response:', response);
          console.log('✅ Save successful - memories created:', response?.length || 0);
          
          return NextResponse.json({ success: true, data: response });
        } catch (error: any) {
          console.error('❌ Mem0 save error:', error);
          console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to save memories',
            details: error.message 
          }, { status: 500 });
        }

      case 'load':
        // Load messages from Mem0
        console.log('Loading with filters:', filters);
        console.log('Filter type:', typeof filters);
        console.log('Filter keys:', Object.keys(filters || {}));
        
        let memories: any[] = [];
        try {
          const searchFilters = filters || {};
          
          if (searchFilters.run_id) {
            // If we have run_id (specific chat), get memories from that chat
            console.log('Loading memories for specific chat:', searchFilters.run_id);
            memories = await client.getAll(searchFilters);
          } else if (searchFilters.user_id) {
            // For cross-chat memory, try different approaches
            console.log('Loading cross-chat memories for user:', searchFilters.user_id);
            
            try {
              // Approach 1: Try to get all memories for user
              console.log('🔄 Trying to get all memories for user...');
              memories = await client.getAll({ user_id: searchFilters.user_id });
              console.log('✅ User memories approach response:', memories);
            } catch (userError: any) {
              console.log('❌ User memories approach failed:', userError.message);
              
              try {
                // Approach 2: Try to search for memories
                console.log('🔄 Trying search approach...');
                memories = await client.search('', { user_id: searchFilters.user_id });
                console.log('✅ Search approach response:', memories);
              } catch (searchError: any) {
                console.log('❌ Search approach failed:', searchError.message);
                
                // Approach 3: Try without filters
                try {
                  console.log('🔄 Trying without filters...');
                  memories = await client.getAll();
                  console.log('✅ No filters approach response:', memories);
                } catch (noFiltersError: any) {
                  console.log('❌ No filters approach failed:', noFiltersError.message);
                  
                  // Approach 4: Try with different parameter format
                  try {
                    console.log('🔄 Trying different parameter format...');
                    memories = await client.getAll({ user_id: searchFilters.user_id, limit: 10 });
                    console.log('✅ Different parameter format response:', memories);
                  } catch (differentFormatError: any) {
                    console.log('❌ Different parameter format failed:', differentFormatError.message);
                    memories = [];
                    console.log('Cross-chat memory not supported by Mem0 - use simple memory instead');
                  }
                }
              }
            }
          } else {
            // No valid filters
            memories = [];
            console.log('No valid filters provided');
          }
          
          console.log('Load response with filters:', memories);
          console.log('Memories count:', memories?.length || 0);
        } catch (error: any) {
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
  } catch (error: any) {
    console.error('Mem0 API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
