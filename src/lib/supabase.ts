// MongoDB API Client integration (formerly Supabase handler)
const IS_SERVER = typeof window === 'undefined';

export async function saveNotebookToDB(notebookId: string, title: string, roomId: string, language?: string, icon?: string) {
  if (IS_SERVER) return;
  try {
    const notebookData: any = { id: notebookId, title };
    if (language) notebookData.language = language;
    if (icon) notebookData.icon = icon;
    const res = await fetch('/api/notebooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notebook: notebookData }) });
    if (res.ok) return;
  } catch (e) { console.warn('MongoDB API save failed, falling back to LocalStorage', e); }
  const saved = localStorage.getItem('lovestudy_notebooks');
  const notebooksList = saved ? JSON.parse(saved) : [];
  const existingIdx = notebooksList.findIndex((n: any) => n.id === notebookId);
  const now = new Date().toISOString();
  if (existingIdx !== -1) notebooksList[existingIdx] = { ...notebooksList[existingIdx], title, room_id: roomId, updated_at: now };
  else notebooksList.push({ id: notebookId, title, room_id: roomId, created_at: now, updated_at: now });
  localStorage.setItem('lovestudy_notebooks', JSON.stringify(notebooksList));
}

export async function saveCellsToDB(notebookId: string, cells: any[], title?: string) {
  if (IS_SERVER) return;
  try {
    const notebookData: any = { id: notebookId, cells };
    if (title) notebookData.title = title;
    const res = await fetch('/api/notebooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notebook: notebookData }) });
    if (res.ok) return;
  } catch (e) { console.warn('MongoDB API cells save failed, falling back to LocalStorage', e); }
  localStorage.setItem(`lovestudy_cells_${notebookId}`, JSON.stringify(cells));
}

export async function loadNotebookFromDB(notebookId: string, defaultCells: any[] = []) {
  if (IS_SERVER) return defaultCells;
  try {
    const res = await fetch('/api/notebooks');
    if (res.ok) {
      const { notebooks } = await res.json();
      const match = notebooks.find((nb: any) => nb.id === notebookId);
      if (match && match.cells && match.cells.length > 0) {
        return match.cells.map((c: any) => ({ id: c.id, type: c.type, content: c.content || '', output: c.output || '', language: c.language || (match.language === 'python_notebook' ? 'python' : match.language) || 'python', executionCount: c.executionCount || 0 }));
      }
    }
  } catch (e) { console.warn('MongoDB API load failed, falling back to LocalStorage', e); }
  const saved = localStorage.getItem(`lovestudy_cells_${notebookId}`);
  return saved ? JSON.parse(saved) : defaultCells;
}

export function saveVersionSnapshot(notebookId: string, cells: any[]) {
  if (IS_SERVER) return;
  const historyKey = `lovestudy_history_${notebookId}`;
  const savedHistory = localStorage.getItem(historyKey);
  const history = savedHistory ? JSON.parse(savedHistory) : [];
  history.push({ timestamp: new Date().toISOString(), cells: JSON.parse(JSON.stringify(cells)) });
  if (history.length > 20) history.shift();
  localStorage.setItem(historyKey, JSON.stringify(history));
}

export function getVersionHistory(notebookId: string) {
  if (IS_SERVER) return [];
  const historyKey = `lovestudy_history_${notebookId}`;
  const savedHistory = localStorage.getItem(historyKey);
  return savedHistory ? JSON.parse(savedHistory) : [];
}
