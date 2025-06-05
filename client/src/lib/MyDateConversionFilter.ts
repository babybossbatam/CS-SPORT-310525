// This file is deprecated and will be removed
// All date filtering should now use MySmartTimeFilter and SimpleDateFilter

export interface DateFilterResult {
  validFixtures: any[];
  rejectedFixtures: Array<{ fixture: any; reason: string }>;
  stats: {
    total: number;
    valid: number;
    rejected: number;
    methods: Record<string, number>;
  };
}

export class MyDateConversionFilter {
  // This class is deprecated - use MySmartTimeFilter and SimpleDateFilter instead
  static filterFixturesForDateSmart(): DateFilterResult {
    return {
      validFixtures: [],
      rejectedFixtures: [],
      stats: {
        total: 0,
        valid: 0,
        rejected: 0,
        methods: {}
      }
    };
  }

  static isFixtureValidForDate(): { isMatch: boolean; method: string; reason: string } {
    return {
      isMatch: false,
      method: 'deprecated',
      reason: 'DEPRECATED - Use MySmartTimeFilter'
    };
  }
}