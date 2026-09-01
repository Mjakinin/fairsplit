import { NextRequest, NextResponse } from 'next/server';
import { ServerGroupStore } from '@/lib/server/groupStore';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id;
    const bundle = ServerGroupStore.getGroupBundle(groupId);

    if (!bundle) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, bundle });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body || (!body.group && !params.id)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const payload = {
      ...body,
      group: body.group || { id: params.id },
    };

    const updatedBundle = ServerGroupStore.saveOrMergeGroup(payload);
    return NextResponse.json({ success: true, bundle: updatedBundle });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
