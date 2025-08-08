
#!/usr/bin/env node

/**
 * Script to generate comprehensive team mappings from API-Football
 * This will fetch all teams and create translation mappings
 */

import axios from 'axios';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-domain.replit.dev' 
  : 'http://localhost:5000';

async function generateTeamMappings() {
  console.log('🚀 Starting team mapping generation...\n');

  try {
    // Step 1: Get current translation stats
    console.log('📊 Getting current translation stats...');
    const statsResponse = await axios.get(`${API_BASE}/api/team-mapping/stats`);
    
    if (statsResponse.data.success) {
      const stats = statsResponse.data.stats;
      console.log(`Current stats:
  - Cache size: ${stats.teamCacheSize}
  - Leagues cached: ${stats.leaguesCached}
  - Total cached teams: ${stats.totalCachedTeams}
  - Popular teams: ${stats.popularTeamsCount}\n`);
    }

    // Step 2: Generate new mappings
    console.log('🔄 Generating new team mappings from API-Football...');
    console.log('⏳ This may take several minutes due to API rate limits...\n');
    
    const generateResponse = await axios.post(`${API_BASE}/api/team-mapping/generate-mappings`);
    
    if (generateResponse.data.success) {
      const result = generateResponse.data;
      console.log(`✅ Successfully generated mappings!
  - Total teams: ${result.count}
  - Sample teams: ${result.sample.join(', ')}...\n`);
      
      // Step 3: Test a few translations
      console.log('🧪 Testing some translations...');
      const testTeams = ['Real Madrid', 'Barcelona', 'Manchester United', 'Liverpool'];
      
      for (const team of testTeams) {
        try {
          const testResponse = await axios.get(`${API_BASE}/api/team-mapping/test/${encodeURIComponent(team)}?language=zh`);
          if (testResponse.data.success) {
            const test = testResponse.data;
            console.log(`  ${test.original} → ${test.translated} ${test.wasTranslated ? '✅' : '❌'}`);
          }
        } catch (error) {
          console.log(`  ${team} → Error testing`);
        }
      }
      
      console.log('\n🎉 Team mapping generation completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Check the generated-team-translations.ts file');
      console.log('2. Review and customize translations as needed');
      console.log('3. The translations are now available in your app');
      
    } else {
      console.error('❌ Failed to generate mappings:', generateResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Error running team mapping generation:');
    if (axios.isAxiosError(error)) {
      console.error(`HTTP ${error.response?.status}: ${error.response?.data?.error || error.message}`);
    } else {
      console.error(error.message);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your server is running on port 5000');
    console.log('2. Check that RAPIDAPI_KEY is set in your environment');
    console.log('3. Verify your API-Football subscription has enough requests');
  }
}

// Run the script
generateTeamMappings().catch(console.error);
