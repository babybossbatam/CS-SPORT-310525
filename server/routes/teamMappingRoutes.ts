
import express from 'express';
import { teamMappingService } from '../services/teamMappingService.js';
import { smartTeamTranslation } from '../../client/src/lib/smartTeamTranslation.js';

const router = express.Router();

// Generate all team mappings from API-Football
router.post('/generate-mappings', async (req, res) => {
  try {
    console.log('🎯 [API] Starting team mapping generation...');
    
    const generatedTranslations = await teamMappingService.generateAllTeamMappings();
    
    res.json({
      success: true,
      message: `Generated translations for ${Object.keys(generatedTranslations).length} teams`,
      count: Object.keys(generatedTranslations).length,
      sample: Object.keys(generatedTranslations).slice(0, 10) // Show first 10 as sample
    });
  } catch (error) {
    console.error('❌ [API] Error generating team mappings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate team mappings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current translation stats
router.get('/stats', (req, res) => {
  try {
    const stats = smartTeamTranslation.getCacheStats();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        popularTeamsCount: Object.keys((smartTeamTranslation as any).popularLeagueTeams || {}).length
      }
    });
  } catch (error) {
    console.error('❌ [API] Error getting translation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get translation stats'
    });
  }
});

// Test translation for specific team
router.get('/test/:teamName', (req, res) => {
  try {
    const { teamName } = req.params;
    const { language = 'zh' } = req.query;
    
    const translated = smartTeamTranslation.translateTeamName(teamName, language as string);
    
    res.json({
      success: true,
      original: teamName,
      translated,
      language: language,
      wasTranslated: translated !== teamName
    });
  } catch (error) {
    console.error('❌ [API] Error testing translation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test translation'
    });
  }
});

export default router;
