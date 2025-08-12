
```typescript
/**
 * Database optimization script for fixture data
 * Run this to add proper indexes for faster queries
 */

import { db } from './db';

export async function optimizeDatabase() {
  try {
    console.log('🔧 [DB Optimization] Adding indexes for faster fixture queries...');
    
    // Add indexes for common query patterns
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_fixtures_date 
      ON fixtures(date);
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_fixtures_league_date 
      ON fixtures(league_id, date);
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_fixtures_country_date 
      ON fixtures(country, date);
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_fixtures_status 
      ON fixtures(status);
    `);
    
    // Composite index for common filter combinations
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_fixtures_date_league_status 
      ON fixtures(date, league_id, status);
    `);
    
    console.log('✅ [DB Optimization] Database indexes added successfully');
  } catch (error) {
    console.error('❌ [DB Optimization] Failed to add indexes:', error);
  }
}

// Run if called directly
if (require.main === module) {
  optimizeDatabase();
}
```
