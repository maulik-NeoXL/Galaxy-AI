import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: { name: string; type: string; url: string }[];
}

export interface IChat extends Document {
  chatId: string;
  userId: string;
  title: string;
  messages: IMessage[];
  timestamp: number;
}

const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  files: [{
    name: { type: String },
    type: { type: String },
    url: { type: String },
  }],
}, { _id: false });

const ChatSchema = new Schema<IChat>({
  chatId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  messages: [MessageSchema],
  timestamp: { type: Number, required: true }
});

// Add indexes for better query performance
ChatSchema.index({ userId: 1, timestamp: -1 }); // For user chat history queries
ChatSchema.index({ chatId: 1 }); // For specific chat lookups
ChatSchema.index({ userId: 1 }); // For user-based queries

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
