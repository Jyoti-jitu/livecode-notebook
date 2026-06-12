import { NextResponse } from 'next/server';
import { connectToDatabase, Presence } from '@/lib/db';
import { memoryUpsertPresence } from '@/lib/presence-memory';

export async function POST(req: Request) {
  const { username, roomId } = await req.json();
  if (!username || !roomId) return NextResponse.json({ error: 'Username and RoomId required' }, { status: 400 });
  try {
    await connectToDatabase();
    await Presence.findOneAndUpdate({ username, roomId }, { lastActive: new Date() }, { upsert: true, new: true });
    await Presence.deleteMany({ lastActive: { $lt: new Date(Date.now() - 12000) } });
    const activePresences = await Presence.find({ roomId });
    const onlineUsers = [...new Set(activePresences.map((p) => p.username))];
    return NextResponse.json({ success: true, onlineUsers });
  } catch (error: unknown) {
    const onlineUsers = memoryUpsertPresence(username, roomId);
    return NextResponse.json({ success: true, onlineUsers, source: 'memory' });
  }
}
