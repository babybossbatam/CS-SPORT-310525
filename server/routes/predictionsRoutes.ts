import express from 'express';

const router = express.Router();

// GET /api/predictions/:fixtureId
router.get('/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    console.log(`🔮 [Predictions] Route hit with full request details:`, {
      fixtureId,
      fixtureIdType: typeof fixtureId,
      params: req.params,
      query: req.query,
      url: req.url,
      method: req.method,
      headers: {
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type']
      },
      timestamp: new Date().toISOString()
    });

    if (!fixtureId) {
      console.error(`❌ [Predictions] No fixture ID provided`);
      return res.json({ 
        response: [],
        error: 'Fixture ID is required' 
      });
    }

    if (fixtureId.trim() === '' || fixtureId === 'undefined' || fixtureId === 'null') {
      console.error(`❌ [Predictions] Invalid fixture ID:`, { fixtureId, type: typeof fixtureId });
      return res.json({ 
        response: [],
        error: 'Invalid fixture ID provided' 
      });
    }

    console.log(`🔮 [Predictions] Starting API request for fixture: ${fixtureId}`);

    const url = `https://api-football-v1.p.rapidapi.com/v3/predictions?fixture=${fixtureId}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    };

    console.log(`🔮 [Predictions] Making RapidAPI request:`, {
      url,
      fixtureId,
      requestOptions: {
        method: options.method,
        headers: {
          'x-rapidapi-host': options.headers['x-rapidapi-host'],
          'x-rapidapi-key': options.headers['x-rapidapi-key'].substring(0, 10) + '...'
        }
      }
    });

    const response = await fetch(url, options);

    console.log(`🔮 [Predictions] RapidAPI response received:`, {
      fixtureId,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        server: response.headers.get('server')
      }
    });

    if (!response.ok) {
      console.error(`❌ [Predictions] RapidAPI HTTP error:`, {
        fixtureId,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return res.json({ 
        response: [],
        error: 'No prediction data available',
        status: response.status,
        statusText: response.statusText
      });
    }

    const result = await response.text();

    console.log(`🔮 [Predictions] Raw API response:`, {
      fixtureId,
      responseLength: result.length,
      responseStart: result.substring(0, 200),
      isHTML: result.trim().startsWith('<!DOCTYPE') || result.trim().startsWith('<html'))
    });

    // Check if response is HTML (error page) instead of JSON
    if (result.trim().startsWith('<!DOCTYPE') || result.trim().startsWith('<html')) {
      console.error(`❌ [Predictions] Received HTML response instead of JSON for fixture ${fixtureId}`);
      return res.json({ 
        response: [],
        error: 'Prediction service temporarily unavailable'
      });
    }

    try {
      const data = JSON.parse(result);

      console.log(`✅ [Predictions] JSON parsed successfully:`, {
        fixtureId,
        dataKeys: Object.keys(data),
        hasResponse: !!data.response,
        responseLength: data.response?.length,
        hasResults: data.results,
        hasPaging: !!data.paging,
        hasErrors: !!data.errors,
        errors: data.errors
      });

      if (!data.response || data.response.length === 0) {
        console.warn(`⚠️ [Predictions] No prediction data in response:`, {
          fixtureId,
          fullResponse: data
        });
        return res.json({ 
          response: [],
          error: 'No prediction data available for this match',
          fixtureId: fixtureId
        });
      }

      // Validate response structure before sending
      const firstItem = data.response?.[0];
      if (!firstItem?.predictions || !firstItem?.teams) {
        console.warn(`⚠️ [Predictions] Response missing required data:`, {
          fixtureId,
          hasPredictions: !!firstItem?.predictions,
          hasTeams: !!firstItem?.teams,
          availableKeys: firstItem ? Object.keys(firstItem) : null
        });
      }

      console.log(`✅ [Predictions] Sending response to client for fixture: ${fixtureId}`, {
        responseStructure: {
          hasResponse: !!data.response,
          responseLength: data.response?.length,
          firstItemKeys: firstItem ? Object.keys(firstItem) : null,
          hasPredictions: !!firstItem?.predictions,
          hasTeams: !!firstItem?.teams,
          hasLeague: !!firstItem?.league,
          predictionWinner: firstItem?.predictions?.winner?.name,
          homeTeam: firstItem?.teams?.home?.name,
          awayTeam: firstItem?.teams?.away?.name
        }
      });
      res.json(data);
    } catch (parseError) {
      console.error(`❌ [Predictions] JSON parse error:`, {
        fixtureId,
        parseError: parseError instanceof Error ? parseError.message : parseError,
        rawResponse: result.substring(0, 1000)
      });
      return res.json({ 
        response: [],
        error: 'Invalid response format from prediction service',
        parseError: parseError instanceof Error ? parseError.message : String(parseError)
      });
    }

  } catch (error) {
    console.error('❌ [Predictions] Error:', error);
    res.json({ 
      response: [],
      error: 'Failed to fetch prediction data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;