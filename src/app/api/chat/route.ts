import { NextResponse } from 'next/server';
import { connectToDatabase, ChatMessage } from '@/lib/db';

export async function GET() {
  try {
    await connectToDatabase();
    const messages = await ChatMessage.find({}).sort({ createdAt: 1 });
    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database connection error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message payload is required' }, { status: 400 });
    const created = await ChatMessage.create({ id: message.id, sender: message.sender, text: message.text, timestamp: message.timestamp, avatar: message.avatar });
    return NextResponse.json({ success: true, message: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Save failed' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectToDatabase();
    await ChatMessage.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Clear failed' }, { status: 500 });
  }
}
