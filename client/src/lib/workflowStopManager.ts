
export class WorkflowStopManager {
  private static instance: WorkflowStopManager;
  private stopButton: HTMLElement | null = null;
  private isInitialized: boolean = false;

  static getInstance(): WorkflowStopManager {
    if (!WorkflowStopManager.instance) {
      WorkflowStopManager.instance = new WorkflowStopManager();
    }
    return WorkflowStopManager.instance;
  }

  init(): void {
    if (this.isInitialized) return;

    this.createEmergencyStopButton();
    this.setupKeyboardShortcuts();
    this.monitorWorkflowHealth();
    
    this.isInitialized = true;
    console.log('🛑 Workflow stop manager initialized');
  }

  private createEmergencyStopButton(): void {
    // Remove existing button
    const existing = document.getElementById('emergency-stop-btn');
    if (existing) existing.remove();

    const stopButton = document.createElement('button');
    stopButton.id = 'emergency-stop-btn';
    stopButton.innerHTML = '🛑 EMERGENCY STOP';
    stopButton.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 10000;
      background: #dc2626;
      color: white;
      border: 2px solid #991b1b;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    `;

    // Add CSS animation
    if (!document.getElementById('emergency-stop-styles')) {
      const style = document.createElement('style');
      style.id = 'emergency-stop-styles';
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    stopButton.onclick = () => this.emergencyStop();
    document.body.appendChild(stopButton);
    this.stopButton = stopButton;
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+S for emergency stop
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        this.emergencyStop();
      }
      
      // Escape key 3 times quickly
      if (event.key === 'Escape') {
        this.handleEscapeSequence();
      }
    });
  }

  private escapeCount = 0;
  private escapeTimeout: NodeJS.Timeout | null = null;

  private handleEscapeSequence(): void {
    this.escapeCount++;
    
    if (this.escapeTimeout) {
      clearTimeout(this.escapeTimeout);
    }
    
    if (this.escapeCount >= 3) {
      console.log('🛑 Triple Escape detected - Emergency stop!');
      this.emergencyStop();
      this.escapeCount = 0;
      return;
    }
    
    this.escapeTimeout = setTimeout(() => {
      this.escapeCount = 0;
    }, 2000);
  }

  private monitorWorkflowHealth(): void {
    setInterval(() => {
      // Check for hung processes
      const memoryInfo = (performance as any).memory;
      if (memoryInfo && memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.9) {
        console.warn('🚨 Memory critical - auto-triggering emergency stop');
        this.emergencyStop();
      }
    }, 10000);
  }

  emergencyStop(): void {
    console.log('🛑 EMERGENCY STOP TRIGGERED');
    
    try {
      // Stop all workflows
      const workflowManager = (window as any).workflowManager;
      if (workflowManager) {
        workflowManager.stopWorkflow();
      }

      // Clear all timers aggressively
      const maxTimerId = setTimeout(() => {}, 0);
      for (let i = 1; i < maxTimerId + 5000; i++) {
        try {
          clearTimeout(i);
          clearInterval(i);
        } catch (e) {}
      }

      // Abort all fetch requests
      if ((window as any).activeControllers) {
        (window as any).activeControllers.forEach((controller: AbortController) => {
          controller.abort();
        });
        (window as any).activeControllers = [];
      }

      // Force garbage collection
      if ((window as any).gc) {
        (window as any).gc();
      }

      // Trigger memory manager cleanup
      const memoryManager = (window as any).MemoryManager?.getInstance();
      if (memoryManager) {
        memoryManager.destroy();
      }

      // Show success message
      this.showStopSuccess();

    } catch (error) {
      console.error('Emergency stop error:', error);
    }
  }

  private showStopSuccess(): void {
    if (this.stopButton) {
      this.stopButton.innerHTML = '✅ STOPPED';
      this.stopButton.style.background = '#16a34a';
      
      setTimeout(() => {
        if (this.stopButton) {
          this.stopButton.innerHTML = '🛑 EMERGENCY STOP';
          this.stopButton.style.background = '#dc2626';
        }
      }, 3000);
    }
  }

  destroy(): void {
    if (this.stopButton) {
      this.stopButton.remove();
      this.stopButton = null;
    }
    
    if (this.escapeTimeout) {
      clearTimeout(this.escapeTimeout);
      this.escapeTimeout = null;
    }
    
    this.isInitialized = false;
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  WorkflowStopManager.getInstance().init();
}
