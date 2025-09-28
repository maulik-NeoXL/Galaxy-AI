# Mem0 Chat Memory Integration

## Setup Instructions

1. **Install Mem0 package** (already done):

   ```bash
   npm install mem0ai
   ```

2. **Get Mem0 API Key**:

   - Go to [Mem0 Dashboard](https://app.mem0.ai/)
   - Create an account and get your API key

3. **Add Environment Variable**:
   Add to your `.env.local` file:

   ```
   MEM0_API_KEY=your_mem0_api_key_here
   ```

4. **Deploy to Vercel**:
   - Add the `MEM0_API_KEY` environment variable in your Vercel project settings
   - Redeploy the application

## Features

- **Auto-save chats**: Conversations are automatically saved to Mem0
- **Chat persistence**: Messages are restored when returning to the app
- **Memory context**: AI can reference previous conversations
- **User-specific storage**: Each user's chats are stored separately

## How it works

1. Each chat session gets a unique `chatId`
2. Messages are saved to Mem0 after each AI response
3. On app load, previous chat history is retrieved
4. File attachments are noted but not stored (only metadata)

## API Endpoints

- `POST /api/mem0` - Handle save/load/search operations
  - `action: 'save'` - Save messages
  - `action: 'load'` - Load chat history
  - `action: 'search'` - Search messages
