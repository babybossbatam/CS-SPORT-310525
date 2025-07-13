
import { WebSocketServer } from 'ws';
import { Server } from 'http';

interface ClientSubscription {
  playerId: number;
  matchId: number;
  type: 'heatmap' | 'stats' | 'events';
}

class AnalyticsWebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<any, ClientSubscription[]>();
  private updateIntervals = new Map<string, NodeJS.Timeout>();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 [WebSocket] New client connected:', req.url);
      
      // Parse connection URL to get subscription details
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const pathParts = url.pathname.split('/');
      
      if (pathParts.length >= 5 && pathParts[2] === 'player-heatmap') {
        const playerId = parseInt(pathParts[3]);
        const matchId = parseInt(pathParts[4]);
        
        if (!isNaN(playerId) && !isNaN(matchId)) {
          this.subscribeClient(ws, { playerId, matchId, type: 'heatmap' });
        }
      }

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('❌ [WebSocket] Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        this.unsubscribeClient(ws);
        console.log('🔌 [WebSocket] Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('❌ [WebSocket] Client error:', error);
      });
    });

    console.log('✅ [WebSocket] Server initialized');
  }

  private subscribeClient(ws: any, subscription: ClientSubscription) {
    const existing = this.clients.get(ws) || [];
    existing.push(subscription);
    this.clients.set(ws, existing);

    // Start sending updates for this subscription
    this.startUpdates(subscription);
    
    console.log(`📡 [WebSocket] Client subscribed to ${subscription.type} for player ${subscription.playerId}, match ${subscription.matchId}`);
  }

  private unsubscribeClient(ws: any) {
    const subscriptions = this.clients.get(ws);
    if (subscriptions) {
      subscriptions.forEach(sub => {
        this.stopUpdates(sub);
      });
    }
    this.clients.delete(ws);
  }

  private handleClientMessage(ws: any, data: any) {
    switch (data.type) {
      case 'subscribe':
        this.subscribeClient(ws, data.subscription);
        break;
      case 'unsubscribe':
        // Handle unsubscribe logic
        break;
      default:
        console.log('🔄 [WebSocket] Unknown message type:', data.type);
    }
  }

  private startUpdates(subscription: ClientSubscription) {
    const key = `${subscription.type}_${subscription.playerId}_${subscription.matchId}`;
    
    if (this.updateIntervals.has(key)) {
      return; // Already running
    }

    const interval = setInterval(async () => {
      await this.sendUpdate(subscription);
    }, 10000); // Update every 10 seconds

    this.updateIntervals.set(key, interval);
  }

  private stopUpdates(subscription: ClientSubscription) {
    const key = `${subscription.type}_${subscription.playerId}_${subscription.matchId}`;
    const interval = this.updateIntervals.get(key);
    
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(key);
    }
  }

  private async sendUpdate(subscription: ClientSubscription) {
    try {
      let updateData;
      
      switch (subscription.type) {
        case 'heatmap':
          updateData = await this.fetchHeatmapUpdate(subscription.playerId, subscription.matchId);
          break;
        default:
          return;
      }

      if (updateData) {
        this.broadcastToSubscribers(subscription, {
          type: `${subscription.type}_update`,
          ...updateData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error(`❌ [WebSocket] Failed to send ${subscription.type} update:`, error);
    }
  }

  private async fetchHeatmapUpdate(playerId: number, matchId: number) {
    try {
      // This would typically fetch from your heatmap API
      const response = await fetch(`http://localhost:5000/api/players/${playerId}/heatmap?eventId=${matchId}`);
      
      if (response.ok) {
        const data = await response.json();
        return { heatmap: data.heatmap || [] };
      }
    } catch (error) {
      console.error('Failed to fetch heatmap update:', error);
    }
    
    return null;
  }

  private broadcastToSubscribers(subscription: ClientSubscription, data: any) {
    this.clients.forEach((subscriptions, ws) => {
      const hasMatchingSubscription = subscriptions.some(sub => 
        sub.playerId === subscription.playerId && 
        sub.matchId === subscription.matchId && 
        sub.type === subscription.type
      );

      if (hasMatchingSubscription && ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(JSON.stringify(data));
        } catch (error) {
          console.error('❌ [WebSocket] Failed to send to client:', error);
        }
      }
    });
  }

  // Public method to manually trigger updates
  triggerUpdate(playerId: number, matchId: number, type: 'heatmap' | 'stats' | 'events') {
    const subscription = { playerId, matchId, type };
    this.sendUpdate(subscription);
  }
}

export const analyticsWebSocket = new AnalyticsWebSocketManager();
