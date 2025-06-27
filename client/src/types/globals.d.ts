
declare global {
  interface Window {
    USW: (action: string, selector: string, widgetType: string, options: any) => void;
  }
}

export {};
