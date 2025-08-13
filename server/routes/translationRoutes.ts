
import { Router } from 'express';
import { translationService } from '../services/translationService.js';
import { db } from '../db.js';
import { leagueTranslations, countryTranslations, teamTranslations } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Get league translation
router.get('/league/:name/:language?', async (req, res) => {
  try {
    const { name, language = 'en' } = req.params;
    const translation = await translationService.getLeagueTranslation(name, language);
    res.json({ 
      original: name,
      translation,
      language,
      cached: true
    });
  } catch (error) {
    console.error('[TranslationAPI] Error getting league translation:', error);
    res.status(500).json({ error: 'Failed to get league translation' });
  }
});

// Get country translation
router.get('/country/:name/:language?', async (req, res) => {
  try {
    const { name, language = 'en' } = req.params;
    const translation = await translationService.getCountryTranslation(name, language);
    res.json({ 
      original: name,
      translation,
      language,
      cached: true
    });
  } catch (error) {
    console.error('[TranslationAPI] Error getting country translation:', error);
    res.status(500).json({ error: 'Failed to get country translation' });
  }
});

// Get team translation
router.get('/team/:name/:language?', async (req, res) => {
  try {
    const { name, language = 'en' } = req.params;
    const translation = await translationService.getTeamTranslation(name, language);
    res.json({ 
      original: name,
      translation,
      language,
      cached: true
    });
  } catch (error) {
    console.error('[TranslationAPI] Error getting team translation:', error);
    res.status(500).json({ error: 'Failed to get team translation' });
  }
});

// Add or update league translation
router.post('/league', async (req, res) => {
  try {
    const { leagueName, translations, leagueId } = req.body;
    
    if (!leagueName || !translations) {
      return res.status(400).json({ error: 'League name and translations are required' });
    }

    await translationService.upsertLeagueTranslation(leagueName, translations, leagueId);
    res.json({ message: 'League translation updated successfully' });
  } catch (error) {
    console.error('[TranslationAPI] Error updating league translation:', error);
    res.status(500).json({ error: 'Failed to update league translation' });
  }
});

// Add or update country translation
router.post('/country', async (req, res) => {
  try {
    const { countryName, translations } = req.body;
    
    if (!countryName || !translations) {
      return res.status(400).json({ error: 'Country name and translations are required' });
    }

    await translationService.upsertCountryTranslation(countryName, translations);
    res.json({ message: 'Country translation updated successfully' });
  } catch (error) {
    console.error('[TranslationAPI] Error updating country translation:', error);
    res.status(500).json({ error: 'Failed to update country translation' });
  }
});

// Add or update team translation
router.post('/team', async (req, res) => {
  try {
    const { teamName, translations, teamId } = req.body;
    
    if (!teamName || !translations) {
      return res.status(400).json({ error: 'Team name and translations are required' });
    }

    await translationService.upsertTeamTranslation(teamName, translations, teamId);
    res.json({ message: 'Team translation updated successfully' });
  } catch (error) {
    console.error('[TranslationAPI] Error updating team translation:', error);
    res.status(500).json({ error: 'Failed to update team translation' });
  }
});

// Bulk import leagues from existing mappings
router.post('/bulk/leagues', async (req, res) => {
  try {
    const { mappings } = req.body;
    
    if (!mappings || typeof mappings !== 'object') {
      return res.status(400).json({ error: 'Mappings object is required' });
    }

    await translationService.bulkLoadLeagueTranslations(mappings);
    res.json({ 
      message: `Successfully imported ${Object.keys(mappings).length} league translations` 
    });
  } catch (error) {
    console.error('[TranslationAPI] Error bulk importing leagues:', error);
    res.status(500).json({ error: 'Failed to bulk import leagues' });
  }
});

// Bulk import countries from existing mappings
router.post('/bulk/countries', async (req, res) => {
  try {
    const { mappings } = req.body;
    
    if (!mappings || typeof mappings !== 'object') {
      return res.status(400).json({ error: 'Mappings object is required' });
    }

    await translationService.bulkLoadCountryTranslations(mappings);
    res.json({ 
      message: `Successfully imported ${Object.keys(mappings).length} country translations` 
    });
  } catch (error) {
    console.error('[TranslationAPI] Error bulk importing countries:', error);
    res.status(500).json({ error: 'Failed to bulk import countries' });
  }
});

// Get all league translations
router.get('/leagues', async (req, res) => {
  try {
    const results = await db.select().from(leagueTranslations);
    res.json(results);
  } catch (error) {
    console.error('[TranslationAPI] Error getting all league translations:', error);
    res.status(500).json({ error: 'Failed to get league translations' });
  }
});

// Get all country translations
router.get('/countries', async (req, res) => {
  try {
    const results = await db.select().from(countryTranslations);
    res.json(results);
  } catch (error) {
    console.error('[TranslationAPI] Error getting all country translations:', error);
    res.status(500).json({ error: 'Failed to get country translations' });
  }
});

// Get cache statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = translationService.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('[TranslationAPI] Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

export default router;
