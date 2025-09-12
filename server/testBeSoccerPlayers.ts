
// Using native fetch API available in Node.js 18+

interface PlayerTestResult {
  playerId: number;
  imageExists: boolean;
  imageUrl: string;
  contentType?: string;
  contentLength?: string;
}

async function testBeSoccerPlayerImages() {
  console.log('🔍 Testing BeSoccer player images...\n');

  // Test with known player IDs (you'll need to find actual ones)
  const testPlayerIds = [
    838122, // Your example
    1,      // Test low ID
    100,    // Test medium ID  
    1000,   // Test higher ID
    10000,  // Test very high ID
    2754,   // From your existing tests
    154672, // From your existing tests
  ];

  const results: PlayerTestResult[] = [];

  for (const playerId of testPlayerIds) {
    console.log(`Testing Player ID: ${playerId}`);
    
    const testUrls = [
      `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
      `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg`,
      `https://cdn.resfu.com/img_data/players/small/${playerId}.jpg?size=120x&lossy=1`,
    ];

    let foundImage = false;
    let successUrl = '';

    for (let i = 0; i < testUrls.length; i++) {
      const testUrl = testUrls[i];
      
      try {
        const response = await fetch(testUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 5000,
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          
          if (contentType?.startsWith('image/') && contentLength && parseInt(contentLength) > 100) {
            console.log(`   ✅ SUCCESS - Source ${i + 1}: ${testUrl}`);
            console.log(`      Content-Type: ${contentType}`);
            console.log(`      Content-Length: ${contentLength}`);
            
            foundImage = true;
            successUrl = testUrl;
            
            results.push({
              playerId,
              imageExists: true,
              imageUrl: testUrl,
              contentType,
              contentLength,
            });
            
            break; // Found a working image, no need to test other URLs
          }
        }
      } catch (error) {
        console.log(`   ❌ Source ${i + 1} failed: ${error.message}`);
      }
    }

    if (!foundImage) {
      console.log(`   ❌ No valid image found for player ${playerId}`);
      results.push({
        playerId,
        imageExists: false,
        imageUrl: '',
      });
    }

    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log(`Total tested: ${testPlayerIds.length}`);
  console.log(`Images found: ${results.filter(r => r.imageExists).length}`);
  console.log(`Images missing: ${results.filter(r => !r.imageExists).length}`);
  
  const workingIds = results.filter(r => r.imageExists).map(r => r.playerId);
  if (workingIds.length > 0) {
    console.log(`\n✅ Working player IDs: ${workingIds.join(', ')}`);
  }

  return results;
}

// Test specific player ID ranges to find valid ones
async function findValidPlayerIdRanges() {
  console.log('🎯 Finding valid BeSoccer player ID ranges...\n');

  const ranges = [
    { start: 1, end: 100, step: 10 },
    { start: 100, end: 1000, step: 50 },
    { start: 1000, end: 10000, step: 100 },
    { start: 10000, end: 100000, step: 1000 },
    { start: 800000, end: 900000, step: 5000 }, // Around your example ID
  ];

  for (const range of ranges) {
    console.log(`Testing range ${range.start}-${range.end} (step: ${range.step})`);
    
    let foundInRange = 0;
    
    for (let id = range.start; id <= range.end; id += range.step) {
      try {
        const testUrl = `https://cdn.resfu.com/img_data/players/medium/${id}.jpg?size=120x&lossy=1`;
        const response = await fetch(testUrl, {
          method: 'HEAD',
          timeout: 3000,
        });

        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          console.log(`   ✅ Found: ${id}`);
          foundInRange++;
        }
      } catch (error) {
        // Silently continue
      }
    }
    
    console.log(`   Range ${range.start}-${range.end}: ${foundInRange} valid images\n`);
  }
}

// Run the tests
if (require.main === module) {
  (async () => {
    try {
      await testBeSoccerPlayerImages();
      console.log('\n' + '='.repeat(50) + '\n');
      await findValidPlayerIdRanges();
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}

export { testBeSoccerPlayerImages, findValidPlayerIdRanges };
