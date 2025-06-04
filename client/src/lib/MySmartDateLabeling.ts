// This file is deprecated and will be removed
// Use SimpleDateFilter instead for all date filtering operations

export interface SmartDateResult {
  label: 'today' | 'yesterday' | 'tomorrow' | 'custom';
  reason: string;
  isActualDate: boolean;
  timeComparison: string;
  customDate?: string;
}

export class MySmartDateLabeling {
  // This class is deprecated - use SimpleDateFilter instead
  static getSmartDateLabel(): SmartDateResult {
    return {
      label: 'today',
      reason: 'DEPRECATED - Use SimpleDateFilter',
      isActualDate: false,
      timeComparison: 'deprecated'
    };
  }

  static getSmartDateLabelForDate(): SmartDateResult {
    return {
      label: 'today',
      reason: 'DEPRECATED - Use SimpleDateFilter',
      isActualDate: false,
      timeComparison: 'deprecated'
    };
  }

  static isSmartToday(): boolean {
    return false;
  }

  static isSmartYesterday(): boolean {
    return false;
  }

  static isSmartTomorrow(): boolean {
    return false;
  }
}