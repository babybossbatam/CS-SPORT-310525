export class ResourceMonitor {
  private static instance: ResourceMonitor;

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  // Disabled to prevent conflicts with Replit Assistant
  init(): void {
    console.log('📊 Resource monitor disabled for Replit compatibility');
  }

  private checkResources(): void {
    // Disabled
  }

  destroy(): void {
    // No-op
  }
}

// Do not auto-initialize
console.log('📊 Resource monitor disabled for Replit Assistant compatibility');