import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const chatId = searchParams.get('chatId');
    
    if (chatId) {
      // Get specific chat
      const chat = await Chat.findOne({ chatId });
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
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
    await connectDB();
    
    const { chatId, userId, title, messages } = await request.json();
    
    if (!chatId || !userId || !title) {
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
      const newChat = new Chat({
        chatId,
        userId,
        title,
        messages: messages || [],
        timestamp: Date.now()
      });
      await newChat.save();
      return NextResponse.json(newChat);
    }
  } catch (error) {
    console.error('Error saving chat:', error);
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
    }
    
    const result = await Chat.deleteOne({ chatId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
