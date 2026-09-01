import { NextRequest, NextResponse } from 'next/server';
import { ServerGroupStore } from '@/lib/server/groupStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || (!body.id && !body.group?.id)) {
      return NextResponse.json({ error: 'Missing group id' }, { status: 400 });
    }

    const payload = body.group ? body : { group: body, members: body.members || [] };
    const updated = ServerGroupStore.saveOrMergeGroup(payload);

    return NextResponse.json({ success: true, bundle: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  if (id) {
    const bundle = ServerGroupStore.getGroupBundle(id);
    if (bundle) {
      return NextResponse.json({ success: true, group: bundle.group, bundle });
    }
  }

  if (token) {
    const bundle = ServerGroupStore.getGroupByToken(token);
    if (bundle) {
      return NextResponse.json({ success: true, group: bundle.group, bundle });
    }
  }

  return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
}
