import { NextResponse } from 'next/server';
import { connectToDatabase, SharedNotes } from '@/lib/db';

export async function GET() {
  try {
    await connectToDatabase();
    let notes = await SharedNotes.findOne({});
    if (!notes) notes = await SharedNotes.create({ notesContent: '# Welcome to our study space 💕' });
    return NextResponse.json({ notesContent: notes.notesContent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { notesContent } = await req.json();
    if (notesContent === undefined) return NextResponse.json({ error: 'notesContent required' }, { status: 400 });
    let notes = await SharedNotes.findOne({});
    if (notes) { notes.notesContent = notesContent; notes.updatedAt = new Date(); await notes.save(); }
    else notes = await SharedNotes.create({ notesContent });
    return NextResponse.json({ success: true, notesContent: notes.notesContent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
