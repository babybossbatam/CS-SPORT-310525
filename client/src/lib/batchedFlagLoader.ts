
interface FlagLoadBatch {
  countries: string[];
  callback: (flags: { [country: string]: string }) => void;
}

class BatchedFlagLoader {
  private batchQueue: FlagLoadBatch[] = [];
  private isProcessing = false;
  private batchDelay = 100; // ms
  private maxBatchSize = 10;

  async loadFlags(countries: string[]): Promise<{ [country: string]: string }> {
    return new Promise((resolve) => {
      this.batchQueue.push({
        countries,
        callback: resolve
      });
      
      this.processBatchQueue();
    });
  }

  private async processBatchQueue() {
    if (this.isProcessing || this.batchQueue.length === 0) return;
    
    this.isProcessing = true;
    
    // Wait for batch delay to collect more requests
    await new Promise(resolve => setTimeout(resolve, this.batchDelay));
    
    // Collect all unique countries from pending batches
    const allCountries = new Set<string>();
    const callbacks: Array<(flags: { [country: string]: string }) => void> = [];
    
    // Process batches up to max size
    const batchesToProcess = this.batchQueue.splice(0, this.maxBatchSize);
    
    batchesToProcess.forEach(batch => {
      batch.countries.forEach(country => allCountries.add(country));
      callbacks.push(batch.callback);
    });
    
    // Load flags for all countries in batch
    const flagResults: { [country: string]: string } = {};
    
    await Promise.all(
      Array.from(allCountries).map(async (country) => {
        try {
          const flag = await this.loadSingleFlag(country);
          if (flag) flagResults[country] = flag;
        } catch (error) {
          console.warn(`Failed to load flag for ${country}:`, error);
        }
      })
    );
    
    // Notify all callbacks
    callbacks.forEach(callback => callback(flagResults));
    
    this.isProcessing = false;
    
    // Process remaining batches
    if (this.batchQueue.length > 0) {
      this.processBatchQueue();
    }
  }

  private async loadSingleFlag(country: string): Promise<string | null> {
    // Import flag utils dynamically to avoid circular dependencies
    const { getCountryFlagWithFallbackSync } = await import('./flagUtils');
    return getCountryFlagWithFallbackSync(country);
  }
}

export const batchedFlagLoader = new BatchedFlagLoader();
