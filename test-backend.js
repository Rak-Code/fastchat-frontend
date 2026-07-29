// Simple Node.js script to test backend connectivity
const fetch = require('node-fetch');

const BACKEND_URL = 'https://fastchat-backend-xujp.onrender.com';

async function testBackend() {
    console.log('🔍 Testing backend connectivity...\n');
    
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    try {
        const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthResponse.status, healthResponse.statusText);
        console.log('📊 Health data:', JSON.stringify(healthData, null, 2));
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }
    
    // Test 2: Chat Endpoint
    console.log('\n2️⃣ Testing chat endpoint...');
    try {
        const chatResponse = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://fastchat-llm.vercel.app'
            },
            body: JSON.stringify({
                conversationId: `test-${Date.now()}`,
                message: 'Hello, this is a test message'
            })
        });
        
        const chatData = await chatResponse.json();
        console.log('✅ Chat test:', chatResponse.status, chatResponse.statusText);
        
        if (chatResponse.ok) {
            console.log('📝 Chat response:', chatData.reply?.substring(0, 100) + '...');
        } else {
            console.log('❌ Chat error:', JSON.stringify(chatData, null, 2));
        }
    } catch (error) {
        console.log('❌ Chat test failed:', error.message);
    }
}

testBackend();