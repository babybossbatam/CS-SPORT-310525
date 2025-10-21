export class MemoryManager {
  private static instance: MemoryManager;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Disabled to prevent conflicts with Replit Assistant
  init(): void {
    console.log('🧠 Memory manager disabled for Replit compatibility');
  }

  private checkMemoryUsage(): void {
    // Disabled
  }

  private emergencyCleanup(): void {
    // Disabled
  }

  destroy(): void {
    // No-op
  }
}

// Do not auto-initialize
console.log('🧠 Memory manager disabled for Replit Assistant compatibility');