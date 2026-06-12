import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const notebookId = searchParams.get('notebookId');
  return NextResponse.json({ status: 'success', cells: notebookId ? [] : [] });
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ status: 'created', cell: { id: `cell-${Date.now()}`, notebookId: body.notebookId, type: body.type || 'code', content: body.content || '' } });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
  }
}
