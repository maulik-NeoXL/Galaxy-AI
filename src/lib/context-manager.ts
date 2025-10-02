export const MODEL_LIMITS = {
  'GPT-3.5 Turbo': 4096,      // ~3000 words
  'GPT-4': 8192,              // ~6000 words  
  'GPT-4 Turbo': 128000,      // ~96000 words
  'GPT-4o': 128000,           // ~96000 words
  'GPT-4o Mini': 128000,      // ~96000 words
  'Gemini Pro': 30720,        // ~23000 words
  'Gemini Pro Vision': 30720, // ~23000 words
  'Gemini 1.5 Pro': 2097152,  // ~1.5M words
  'Gemini 1.5 Flash': 1048576, // ~750K words
  'Grok-1': 32768,            // ~25K words
  'Grok-2': 131072            // ~98K words
} as const;

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Estimate token count for messages (rough estimation)
 * 1 token ≈ 4 characters for English text
 */
export function estimateTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => {
    // Count characters and divide by 4 for rough token estimation
    const content = msg.content || '';
    return total + Math.ceil(content.length / 4);
  }, 0);
}

/**
 * Get model-specific token limit
 */
export function getModelLimit(model: string): number {
  return MODEL_LIMITS[model as keyof typeof MODEL_LIMITS] || MODEL_LIMITS['GPT-3.5 Turbo'];
}

/**
 * Generate a summary for a segment of messages
 */
export function generateSegmentSummary(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  const topics = userMessages.slice(0, 3).map(m => m.content.substring(0, 100));
  const responsesCount = assistantMessages.length;
  
  return `Discussion included ${messages.length} messages. Topics: ${topics.join('; ')}${topics.length > 3 ? '...' : ''}. Total exchanges: ${responsesCount}`;
}

/**
 * Trim messages to fit within model's context window
 */
export function trimMessagesForModel(messages: Message[], model: string): {
  trimmedMessages: Message[];
  wasTrimmed: boolean;
  originalCount: number;
  tokenCount: string;
} {
  const maxTokens = getModelLimit(model);
  const safeLimit = Math.floor(maxTokens * 0.85); // 85% safety margin
  const currentTokens = estimateTokens(messages);
  
  // If we're under the limit, return as-is
  if (currentTokens <= safeLimit) {
    return {
      trimmedMessages: messages,
      wasTrimmed: false,
      originalCount: messages.length,
      tokenCount: `${currentTokens}/${safeLimit}`
    };
  }
  
  console.log(`⚠️ Context trimming for ${model}: ${currentTokens} tokens → target ${safeLimit}`);
  
  // Always keep system message and first user message
  const systemMessage = messages.find(m => m.role === 'system');
  const firstUserMessage = messages.find(m => m.role === 'user');
  const recentMessages = messages.slice(-20); // Keep last 20 messages
  
  // Build result array
  const result: Message[] = [];
  
  // Add system message
  if (systemMessage) {
    result.push(systemMessage);
  }
  
  // Add summary of middle section if needed
  if (firstUserMessage && !recentMessages.includes(firstUserMessage)) {
    result.push({
      role: 'system',
      content: `[Previous conversation context includes discussion starting with: "${firstUserMessage.content.substring(0, 200)}..."]`
    });
  }
  
  // Add recent messages
  result.push(...recentMessages);
  
  // Verify we're within limits, if not trim more aggressively
  let iterations = 0;
  while (estimateTokens(result) > safeLimit && iterations < 10) {
    // Remove oldest non-system message from recent messages
    const nonSystemMessages = result.filter(m => m.role !== 'system');
    if (nonSystemMessages.length > 2) { // Keep at least 2 messages
      const index = result.indexOf(nonSystemMessages[0]);
      if (index !== -1) {
        result.splice(index, 1);
      }
    } else {
      break;
    }
    iterations++;
  }
  
  const finalTokens = estimateTokens(result);
  
  // Log the optimization
  console.log(`✅ Context optimization completed:
    📊 Model: ${model}
    📝 Messages: ${messages.length} → ${result.length}
    🎯 Tokens: ${currentTokens} → ${finalTokens}/${maxTokens}
    💾 Space saved: ${Math.round((1 - finalTokens / currentTokens) * 100)}%`);
  
  return {
    trimmedMessages: result,
    wasTrimmed: true,
    originalCount: messages.length,
    tokenCount: `${finalTokens}/${safeLimit}`
  };
}

/**
 * Create smart segmented context for very long conversations
 */
export async function createSegmentedContext(
  messages: Message[], 
  memories: Array<{memory: string; role?: string; content?: string}>, 
  maxTokens: number
): Promise<Message[]> {
  
  // If conversation is short enough, just trim normally
  if (estimateTokens(messages) <= maxTokens * 0.8) {
    return messages;
  }
  
  // Break into topic-based segments
  const segments = [];
  let currentSegment = [];
  let currentTokens = 0;
  
  for (const message of messages) {
    const messageTokens = estimateTokens([message]);
    
    // If adding this message exceeds 70% of limit, start new segment
    if (currentTokens + messageTokens > maxTokens * 0.7) {
      if (currentSegment.length > 0) {
        segments.push({
          messages: currentSegment,
          tokenCount: currentTokens,
          summary: generateSegmentSummary(currentSegment)
        });
      }
      currentSegment = [];
      currentTokens = 0;
    }
    
    currentSegment.push(message);
    currentTokens += messageTokens;
  }
  
  // Add final segment
  if (currentSegment.length > 0) {
    segments.push({
      messages: currentSegment,
      tokenCount: currentTokens,
      summary: generateSegmentSummary(currentSegment)
    });
  }
  
  // If we have multiple segments, create summary-based context
  if (segments.length > 2) {
    const recentSegment = segments[segments.length - 1];
    const summaryContext = segments.slice(0, -1).map((s, index) => ({
      role: 'system' as const,
      content: `[Context Segment ${index + 1}]: ${s.summary} (${s.messages.length} messages)`
    }));
    
    return [...summaryContext, ...recentSegment.messages];
  }
  
  // Otherwise return the most recent segments
  return segments.flatMap(s => s.messages);
}
