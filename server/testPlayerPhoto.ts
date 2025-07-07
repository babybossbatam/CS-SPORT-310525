
import fetch from 'node-fetch';

async function testPlayerPhoto() {
  // Common variations of L. de la Torre name and possible player IDs
  const playerVariations = [
    'L. de la Torre',
    'Lucas de la Torre', 
    'Luis de la Torre',
    'Leonardo de la Torre',
    'Lorenzo de la Torre'
  ];

  // Some known player IDs for L. de la Torre (you may need to find the correct one)
  const possiblePlayerIds = [
    2754,   // Example ID - you'll need to find the correct one
    154672, // Another possible ID
    2648,   // Another variation
  ];

  console.log('🔍 Testing L. de la Torre player photo availability...\n');

  // Test our API endpoint with possible IDs
  for (const playerId of possiblePlayerIds) {
    try {
      console.log(`Testing Player ID: ${playerId}`);
      
      const response = await fetch(`http://localhost:5000/api/player-photo/${playerId}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        console.log(`✅ SUCCESS for ID ${playerId}`);
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Content-Length: ${contentLength}`);
        
        // Test if it's a valid image
        if (contentType?.startsWith('image/') && contentLength && parseInt(contentLength) > 100) {
          console.log(`   ✅ Valid image found for player ID ${playerId}\n`);
        } else {
          console.log(`   ⚠️ Response received but may not be a valid image\n`);
        }
      } else {
        console.log(`❌ FAILED for ID ${playerId} - Status: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ ERROR for ID ${playerId}: ${error.message}\n`);
    }
  }

  // Test the player image cache system
  console.log('🧪 Testing player image cache system...\n');
  
  try {
    // Import the player image cache
    const { getPlayerImage } = await import('../client/src/lib/playerImageCache.ts');
    
    for (const playerId of possiblePlayerIds) {
      try {
        const imageUrl = await getPlayerImage(playerId, 'L. de la Torre');
        console.log(`Cache test for ID ${playerId}: ${imageUrl}`);
      } catch (error) {
        console.log(`Cache error for ID ${playerId}: ${error.message}`);
      }
    }
  } catch (importError) {
    console.log('Could not test cache system:', importError.message);
  }

  // Test external photo sources directly
  console.log('\n🌐 Testing external photo sources...\n');
  
  const photoSources = [
    (id: number) => `https://media.api-sports.io/football/players/${id}.png`,
    (id: number) => `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:${id}.png,r_max,c_thumb,g_face,z_0.65/v16/Athletes/NationalTeam/${id}`,
    (id: number) => `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:${id}.png/v16/Athletes/${id}`,
    (id: number) => `https://cdn.sportmonks.com/images/soccer/players/${id}.png`,
    (id: number) => `https://img.a.transfermarkt.technology/portrait/big/${id}.jpg`,
  ];

  for (const playerId of possiblePlayerIds) {
    console.log(`Testing external sources for Player ID: ${playerId}`);
    
    for (let i = 0; i < photoSources.length; i++) {
      const photoUrl = photoSources[i](playerId);
      try {
        const response = await fetch(photoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 5000,
        });

        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          console.log(`   ✅ Source ${i + 1}: ${photoUrl}`);
        } else {
          console.log(`   ❌ Source ${i + 1}: Failed (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ Source ${i + 1}: Error - ${error.message}`);
      }
    }
    console.log('');
  }
}

// Run the test
testPlayerPhoto().catch(console.error);
