const { MemoryClient } = require('mem0ai');
require('dotenv').config({ path: '.env.local' });

async function testMem0() {
  try {
    console.log('API Key:', process.env.MEM0_API_KEY ? 'Set' : 'Not set');
    
    const client = new MemoryClient({
      apiKey: process.env.MEM0_API_KEY
    });

    console.log('Testing ping...');
    const pingResult = await client.ping();
    console.log('Ping result:', pingResult);

    console.log('Testing add...');
    const addResult = await client.add([
      { role: 'user', content: 'Hello, this is a test message' },
      { role: 'assistant', content: 'Hi! This is a test response' }
    ], {
      user_id: 'test_user',
      run_id: 'test_chat_123'
    });
    console.log('Add result:', addResult);

    console.log('Testing getAll with filters...');
    const getAllResult = await client.getAll({
      user_id: 'test_user',
      run_id: 'test_chat_123'
    });
    console.log('GetAll result with filters:', getAllResult);

    console.log('Testing getAll with empty object...');
    const getAllEmpty = await client.getAll({});
    console.log('GetAll result with empty object:', getAllEmpty);

  } catch (error) {
    console.error('Error:', error);
  }
}

testMem0();
