import { NextResponse } from 'next/server';
import { connectToDatabase, Activity, Presence } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const activePresences = await Presence.find({});
    const onlineUsers = activePresences.map((p) => p.username);
    let dbActivities = await Activity.find({}).sort({ timestamp: -1 }).limit(10);
    const activities = dbActivities.map((act) => {
      const elapsed = Date.now() - new Date(act.timestamp).getTime();
      let timeStr = 'Just now';
      if (elapsed > 60000 * 60 * 24) timeStr = new Date(act.timestamp).toLocaleDateString();
      else if (elapsed > 60000 * 60) timeStr = `${Math.floor(elapsed / (60000 * 60))} hrs ago`;
      else if (elapsed > 60000) timeStr = `${Math.floor(elapsed / 60000)} min ago`;
      const isAnanya = act.user === 'Ananya';
      return { time: timeStr, user: isAnanya ? 'Ananya 💕' : 'Jitu 💜', action: act.action, notebook: act.notebook, color: isAnanya ? 'bg-rose-500/10 text-love-primary' : 'bg-purple-500/10 text-love-lavender' };
    });
    return NextResponse.json({ status: 'success', presence: [{ name: 'Jitu', online: onlineUsers.includes('Jitu') }, { name: 'Ananya', online: onlineUsers.includes('Ananya') }], activities });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { user, action, notebook } = await request.json();
    if (!user || !action || !notebook) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await Activity.create({ id: `act-${Date.now()}`, user, action, notebook, timestamp: new Date() });
    return NextResponse.json({ status: 'success', activity: created });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
