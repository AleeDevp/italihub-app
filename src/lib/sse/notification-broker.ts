// Simple in-memory SSE broker for per-user connections
// NOTE: Works for single-process deployments. For multi-instance, back with Redis Pub/Sub.

type SendFn = (event: string, data: any) => void;

interface Connection {
  id: string;
  userId: string;
  send: SendFn;
  close: () => void;
}

class NotificationBroker {
  private connections: Map<string, Set<Connection>>; // userId -> connections

  constructor() {
    this.connections = new Map();
  }

  addConnection(conn: Connection) {
    const set = this.connections.get(conn.userId) ?? new Set<Connection>();
    set.add(conn);
    this.connections.set(conn.userId, set);
  }

  removeConnection(conn: Connection) {
    const set = this.connections.get(conn.userId);
    if (!set) return;
    set.delete(conn);
    if (set.size === 0) this.connections.delete(conn.userId);
  }

  publish(userId: string, event: string, data: any) {
    const set = this.connections.get(userId);
    if (!set || set.size === 0) return;
    for (const conn of set) {
      try {
        conn.send(event, data);
      } catch (e) {
        // best-effort
        try {
          conn.close();
        } catch {}
        this.removeConnection(conn);
      }
    }
  }

  getUserConnectionCount(userId: string) {
    return this.connections.get(userId)?.size ?? 0;
  }
}

// Use a global singleton to survive hot reloads in dev
const globalAny = globalThis as unknown as { __notificationBroker?: NotificationBroker };
export const notificationBroker =
  globalAny.__notificationBroker ?? (globalAny.__notificationBroker = new NotificationBroker());
