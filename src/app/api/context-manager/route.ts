import { NextRequest, NextResponse } from 'next/server';
import { trimMessagesForModel, createSegmentedContext, estimateTokens } from '@/lib/context-manager';

export async function POST(request: NextRequest) {
  try {
    const { chatId, userId, model, messages, action } = await request.json();

    switch (action) {
      case 'optimize_context':
        // Optimize context for a specific model
        const optimizedResult = trimMessagesForModel(messages, model);
        
        return NextResponse.json({
          success: true,
          data: {
            optimizedMessages: optimizedResult.trimmedMessages,
            wasTrimmed: optimizedResult.wasTrimmed,
            originalCount: optimizedResult.originalCount,
            tokenCount: optimizedResult.tokenCount,
            model,
            chatId
          }
        });

      case 'segment_long_conversation':
        // Create smart segments for very long conversations
        if (messages.length < 30) {
          return NextResponse.json({
            success: true,
            data: { messages, wasTrimmed: false, reason: 'conversation_not_long_enough' }
          });
        }

        // Load memories for context
        const memories = await loadUserMemories(userId, chatId);
        
        // Create segmented context
        const maxTokens = getModelLimit(model);
        const segmentedMessages = await createSegmentedContext(messages, memories || [], maxTokens);
        
        return NextResponse.json({
          success: true,
          data: {
            segmentedMessages,
            wasTrimmed: messages.length !== segmentedMessages.length,
            originalCount: messages.length,
            finalCount: segmentedMessages.length,
            chatId,
            userId
          }
        });

      case 'estimate_tokens':
        // Return token count estimation
        const tokenCount = estimateTokens(messages);
        const modelLimit = getModelLimit(model);
        
        return NextResponse.json({
          success: true,
          data: {
            tokenCount,
            modelLimit,
            percentage: Math.round((tokenCount / modelLimit) * 100),
            needsOptimization: tokenCount > modelLimit * 0.85,
            model
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: optimize_context, segment_long_conversation, estimate_tokens'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Context manager error:', error);
    return NextResponse.json({
      success: false,
      error: 'Context optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to load user memories
async function loadUserMemories(userId: string, chatId: string) {
  try {
    const response = await fetch(`/api/simple-memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'load',
        userId,
        runId: chatId
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to load memories:', error);
    return [];
  }
}

// Helper function to get model limit
function getModelLimit(model: string): number {
  const MODEL_LIMITS = {
    'GPT-3.5 Turbo': 4096,
    'GPT-4': 8192,
    'GPT-4 Turbo': 128000,
    'GPT-4o': 128000,
    'GPT-4o Mini': 128000,
    'Gemini Pro': 30720,
    'Gemini Pro Vision': 30720,
    'Gemini 1.5 Pro': 2097152,
    'Gemini 1.5 Flash': 1048576,
    'Grok-1': 32768,
    'Grok-2': 131072
  };
  
  return MODEL_LIMITS[model as keyof typeof MODEL_LIMITS] || MODEL_LIMITS['GPT-3.5 Turbo'];
}
