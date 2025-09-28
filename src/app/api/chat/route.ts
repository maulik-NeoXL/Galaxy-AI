import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  // Map display names to actual model IDs and providers
  const modelMap: { [key: string]: { provider: typeof openai | typeof google | typeof xai, modelId: string } } = {
    'GPT-3.5 Turbo': { provider: openai, modelId: 'gpt-3.5-turbo' },
    'GPT-4': { provider: openai, modelId: 'gpt-4' },
    'GPT-4 Turbo': { provider: openai, modelId: 'gpt-4-turbo' },
    'GPT-4o': { provider: openai, modelId: 'gpt-4o' },
    'GPT-4o Mini': { provider: openai, modelId: 'gpt-4o-mini' },
    'Gemini Pro': { provider: google, modelId: 'gemini-pro' },
    'Gemini Pro Vision': { provider: google, modelId: 'gemini-pro-vision' },
    'Gemini 1.5 Pro': { provider: google, modelId: 'gemini-1.5-pro' },
    'Gemini 1.5 Flash': { provider: google, modelId: 'gemini-1.5-flash' },
    'Grok-1': { provider: xai, modelId: 'grok-beta' },
    'Grok-2': { provider: xai, modelId: 'grok-2-1212' }
  };

  const selectedModel = modelMap[model] || modelMap['GPT-3.5 Turbo'];

  const result = await streamText({
    model: selectedModel.provider(selectedModel.modelId),
    messages,
  });

  return result.toTextStreamResponse();
}
