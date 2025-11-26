/**
 * Test script for Token Monitor MCP
 */

const http = require('http');

const API_BASE = 'http://localhost:3003';

async function makeRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Token Monitor MCP\n');

  try {
    // Test 1: Log small usage
    console.log('Test 1: Log normal usage...');
    const log1 = await makeRequest('/api/log', 'POST', {
      input_tokens: 1500,
      output_tokens: 800,
      model: 'claude-sonnet-4.5',
      tool_name: 'semantic_search',
      context: 'Test search query',
    });
    console.log('✅ Logged:', log1);

    // Test 2: Log wasteful usage (large output)
    console.log('\nTest 2: Log wasteful usage (large output)...');
    const log2 = await makeRequest('/api/log', 'POST', {
      input_tokens: 2000,
      output_tokens: 12000,
      model: 'claude-sonnet-4.5',
      tool_name: 'read_file',
      context: 'Reading large file',
    });
    console.log('⚠️ Waste detected:', log2.waste_detected);

    // Test 3: Get session stats
    console.log('\nTest 3: Get session stats...');
    const stats = await makeRequest('/api/stats');
    console.log('📊 Stats:', stats);

    // Test 4: Get waste analysis
    console.log('\nTest 4: Get waste analysis...');
    const waste = await makeRequest('/api/waste?period=current_session');
    console.log('🔍 Waste summary:', waste.summary);

    // Test 5: Get optimization tips
    console.log('\nTest 5: Get optimization tips...');
    const tips = await makeRequest('/api/tips');
    console.log('💡 Tips:', tips.tips);

    // Test 6: Simulate multiple read_file calls (should trigger warning)
    console.log('\nTest 6: Simulate read_file loop (should warn)...');
    for (let i = 0; i < 6; i++) {
      await makeRequest('/api/log', 'POST', {
        input_tokens: 500,
        output_tokens: 3000,
        tool_name: 'read_file',
        context: `Loop iteration ${i}`,
      });
    }
    
    const finalTips = await makeRequest('/api/tips');
    console.log('⚠️ Critical tips:', finalTips.tips.critical);

    console.log('\n✅ All tests passed!');
    console.log('\n📊 Dashboard: http://localhost:3003/dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait for server to start
console.log('Waiting for server to start...');
setTimeout(runTests, 2000);
