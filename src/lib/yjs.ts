import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const yDocsRegistry = new Map<string, Y.Doc>();
const providersRegistry = new Map<string, WebsocketProvider>();

export function getOrCreateYjsDoc(notebookId: string): Y.Doc {
  if (yDocsRegistry.has(notebookId)) return yDocsRegistry.get(notebookId)!;
  const ydoc = new Y.Doc();
  yDocsRegistry.set(notebookId, ydoc);
  return ydoc;
}

export function getOrCreateWebsocketProvider(roomId: string, ydoc: Y.Doc): WebsocketProvider {
  const connectionKey = `${roomId}-${ydoc.clientID}`;
  if (providersRegistry.has(connectionKey)) return providersRegistry.get(connectionKey)!;
  const provider = new WebsocketProvider('wss://demos.yjs.dev', `lovestudy-room-${roomId}`, ydoc);
  providersRegistry.set(connectionKey, provider);
  const isOwner = typeof window !== 'undefined' && !window.location.search.includes('user=ananya');
  provider.awareness.setLocalStateField('user', {
    name: isOwner ? 'Jitu' : 'Ananya',
    color: isOwner ? '#A78BFA' : '#FF5C93',
  });
  return provider;
}

export function disconnectAllYjs() {
  providersRegistry.forEach(p => p.disconnect());
  providersRegistry.clear();
  yDocsRegistry.clear();
}
