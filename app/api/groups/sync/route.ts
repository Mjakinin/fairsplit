import { NextRequest, NextResponse } from 'next/server';

// In-memory server cache for groups across serverless invocations
const serverGroupCache = new Map<string, any>();
const tokenToIdMap = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Missing group id' }, { status: 400 });
    }

    serverGroupCache.set(body.id, body);
    if (body.invite_token) {
      tokenToIdMap.set(body.invite_token.toLowerCase(), body.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  if (id && serverGroupCache.has(id)) {
    return NextResponse.json({ success: true, group: serverGroupCache.get(id) });
  }

  if (token) {
    const tokenLower = token.toLowerCase();
    const groupId = tokenToIdMap.get(tokenLower);
    if (groupId && serverGroupCache.has(groupId)) {
      return NextResponse.json({ success: true, group: serverGroupCache.get(groupId) });
    }
  }

  return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
}
