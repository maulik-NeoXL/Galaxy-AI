import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'dall-e-3' } = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Supported image generation models
    const supportedModels = ['dall-e-2', 'dall-e-3'];
    
    if (!supportedModels.includes(model)) {
      return Response.json({ 
        error: `Unsupported model. Supported models: ${supportedModels.join(', ')}` 
      }, { status: 400 });
    }

    // Determine model parameters
    const modelParams: any = {
      model,
      prompt: prompt.trim(),
      n: 1, // Generate 1 image
    };

    // Set model-specific parameters
    if (model === 'dall-e-3') {
      modelParams.size = '1024x1024';
      modelParams.quality = 'standard'; // 'standard' or 'hd'
      modelParams.style = 'vivid'; // 'vivid' or 'natural'
    } else if (model === 'dall-e-2') {
      modelParams.size = '1024x1024';
    }

    console.log(`🎨 Generating image with ${model}: "${prompt}"`);

    // Generate image
    const imageResponse = await openai.images.generate(modelParams);

    if (!imageResponse.data || imageResponse.data.length === 0) {
      throw new Error('No image generated');
    }

    const generatedImage = imageResponse.data[0];

    console.log(`✅ Image generated successfully: ${generatedImage.url}`);

    return Response.json({
      success: true,
      image: {
        url: generatedImage.url,
        revised_prompt: generatedImage.revised_prompt || prompt,
        model: model
      },
      tokens_used: {
        input: Math.ceil(prompt.length / 4), // Rough estimation
        cost: model === 'dall-e-3' ? 0.04 : 0.016 // Approximate cost
      }
    });

  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    
    return Response.json({
      error: error.message || 'Failed to generate image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
