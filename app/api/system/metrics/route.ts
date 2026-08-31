import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { key, slug } = await req.json();

    const expectedSlug = process.env.ADMIN_SECRET_SLUG || 'cockpit-892';
    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PIN || 'admin2026';

    if (slug !== expectedSlug) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (key && key.trim() === expectedPassword.trim()) {
      const token = Buffer.from(`auth_${Date.now()}_${Math.random()}`).toString('base64');
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: false, error: 'Ungültiger Schlüssel.' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
