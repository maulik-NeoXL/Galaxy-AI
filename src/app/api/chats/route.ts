import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

export async function GET(request: NextRequest) {
  try {
    console.log('Chats API GET request received');
    await connectDB();
    console.log('MongoDB connected for GET request');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const chatId = searchParams.get('chatId');
    
    if (chatId) {
      // Get specific chat
      console.log('Looking for chatId:', chatId);
      const chat = await Chat.findOne({ chatId });
      if (!chat) {
        console.log('Chat not found in database for ID:', chatId);
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      console.log('Chat found:', chat.title);
      return NextResponse.json(chat);
    }
    
    if (userId) {
      // Get all chats for user
      const chats = await Chat.find({ userId })
        .sort({ timestamp: -1 })
        .select('chatId title timestamp messages');
      return NextResponse.json(chats);
    }
    
    return NextResponse.json({ error: 'Missing userId or chatId' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Chats API POST request received');
    await connectDB();
    console.log('MongoDB connected for POST request');
    
    const { chatId, userId, title, messages } = await request.json();
    
    console.log('POST chat data:', { chatId, userId, title, messageCount: messages?.length || 0 });
    
    if (!chatId || !userId || !title) {
      console.log('Missing required fields:', { chatId: !!chatId, userId: !!userId, title: !!title });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if chat exists
    const existingChat = await Chat.findOne({ chatId });
    
    if (existingChat) {
      // Update existing chat
      existingChat.title = title;
      existingChat.messages = messages || [];
      existingChat.timestamp = Date.now();
      await existingChat.save();
      return NextResponse.json(existingChat);
    } else {
      // Create new chat
      console.log('Creating new chat with data:', { chatId, userId, title, messageCount: messages?.length || 0 });
      const newChat = new Chat({
        chatId,
        userId,
        title,
        messages: messages || [],
        timestamp: Date.now()
      });
      
      try {
        const savedChat = await newChat.save();
        console.log('Chat saved successfully:', savedChat.chatId);
        return NextResponse.json(savedChat);
      } catch (saveError) {
        console.error('Error saving new chat:', saveError);
        console.error('Chat data that failed:', newChat);
        throw saveError;
      }
    }
  } catch (error) {
    console.error('Detailed error saving chat:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'Failed to save chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  
  console.log('DELETE request for chatId:', chatId);
  
  if (!chatId) {
    return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
  }
  
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');
    
    console.log('Deleting chat with ID:', chatId);
    const result = await Chat.deleteOne({ chatId });
    console.log('Delete result:', result);
    
    if (result.deletedCount === 0) {
      console.log('Chat not found in database');
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    console.log('Chat deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Detailed error in DELETE:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json({ 
      error: 'Failed to delete chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
