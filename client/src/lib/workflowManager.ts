
export class WorkflowManager {
  private static instance: WorkflowManager;
  private isRunning: boolean = false;
  private intervalHandles: NodeJS.Timeout[] = [];

  static getInstance(): WorkflowManager {
    if (!WorkflowManager.instance) {
      WorkflowManager.instance = new WorkflowManager();
    }
    return WorkflowManager.instance;
  }

  startWorkflow(): void {
    if (this.isRunning) {
      console.warn('⚠️ Workflow already running');
      return;
    }

    this.isRunning = true;
    console.log('▶️ Starting workflow');

    // Add global stop handler
    this.addStopHandler();
  }

  stopWorkflow(): void {
    if (!this.isRunning) {
      console.warn('⚠️ Workflow not running');
      return;
    }

    console.log('⏹️ Stopping workflow...');
    
    // Clear all intervals
    this.intervalHandles.forEach(handle => clearInterval(handle));
    this.intervalHandles = [];
    
    // Clear all timeouts
    let timeoutId = setTimeout(() => {}, 0);
    for (let i = 1; i < timeoutId; i++) {
      clearTimeout(i);
    }

    this.isRunning = false;
    console.log('✅ Workflow stopped');
  }

  private addStopHandler(): void {
    // Add keyboard shortcut to stop workflow
    const stopHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'c') {
        console.log('🛑 Ctrl+C detected, stopping workflow');
        this.stopWorkflow();
        document.removeEventListener('keydown', stopHandler);
      }
    };

    document.addEventListener('keydown', stopHandler);

    // Add visual stop button
    this.addStopButton();
  }

  private addStopButton(): void {
    if (document.getElementById('workflow-stop-btn')) return;

    const stopButton = document.createElement('button');
    stopButton.id = 'workflow-stop-btn';
    stopButton.innerHTML = '⏹️ Stop Workflow';
    stopButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: red;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `;

    stopButton.onclick = () => {
      this.stopWorkflow();
      stopButton.remove();
    };

    document.body.appendChild(stopButton);
  }

  addInterval(handle: NodeJS.Timeout): void {
    this.intervalHandles.push(handle);
  }
}

// Global access
if (typeof window !== 'undefined') {
  (window as any).workflowManager = WorkflowManager.getInstance();
  (window as any).stopWorkflow = () => WorkflowManager.getInstance().stopWorkflow();
}
