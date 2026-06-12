import { NextResponse } from 'next/server';
import { connectToDatabase, RoomState } from '@/lib/db';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || 'love-study-room';
    let state = await RoomState.findOne({ roomId });
    if (!state) state = await RoomState.create({ roomId, streakDays: 0, streakHearts: 0, streakGoalProgress: 0, studyTimeElapsed: 0, heartReactionCount: 0, currentMood: '😊 Focused' });
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { roomId, streakDays, streakHearts, streakGoalProgress, studyTimeElapsed, heartReactionCount, currentMood } = body;
    if (!roomId) return NextResponse.json({ error: 'RoomId required' }, { status: 400 });
    const updateData: any = { updatedAt: new Date() };
    if (streakDays !== undefined) updateData.streakDays = streakDays;
    if (streakHearts !== undefined) { updateData.streakHearts = streakHearts; updateData.streakGoalProgress = Math.min(100, Math.round((streakHearts / 40) * 100)); }
    if (streakGoalProgress !== undefined) updateData.streakGoalProgress = streakGoalProgress;
    if (studyTimeElapsed !== undefined) updateData.studyTimeElapsed = studyTimeElapsed;
    if (heartReactionCount !== undefined) updateData.heartReactionCount = heartReactionCount;
    if (currentMood !== undefined) updateData.currentMood = currentMood;
    const state = await RoomState.findOneAndUpdate({ roomId }, updateData, { upsert: true, new: true });
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
