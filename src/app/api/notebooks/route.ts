import { NextResponse } from 'next/server';
import { connectToDatabase, Notebook } from '@/lib/db';

export async function GET() {
  try {
    await connectToDatabase();
    const notebooks = await Notebook.find({});
    return NextResponse.json({ notebooks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database connection error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    if (body.notebook) {
      const { notebook } = body;
      const updateFields: any = { updatedAt: new Date() };
      if (notebook.title !== undefined) updateFields.title = notebook.title;
      if (notebook.icon !== undefined) updateFields.icon = notebook.icon;
      if (notebook.language !== undefined) updateFields.language = notebook.language;
      if (notebook.cells !== undefined) updateFields.cells = notebook.cells;
      const updated = await Notebook.findOneAndUpdate({ id: notebook.id }, updateFields, { upsert: true, new: true });
      return NextResponse.json({ success: true, notebook: updated });
    }
    if (body.notebooks && Array.isArray(body.notebooks)) {
      const results = [];
      for (const nb of body.notebooks) {
        const updateFields: any = { updatedAt: new Date() };
        if (nb.title !== undefined) updateFields.title = nb.title;
        if (nb.icon !== undefined) updateFields.icon = nb.icon;
        if (nb.language !== undefined) updateFields.language = nb.language;
        if (nb.cells !== undefined) updateFields.cells = nb.cells;
        const res = await Notebook.findOneAndUpdate({ id: nb.id }, updateFields, { upsert: true, new: true });
        results.push(res);
      }
      return NextResponse.json({ success: true, count: results.length });
    }
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upsert failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Notebook ID required' }, { status: 400 });
    await Notebook.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
