import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Passwort erforderlich.' },
        { status: 400 }
      );
    }

    // Get Secret from Environment Variable (Netlify / .env.local)
    const secretAdminPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PIN || 'admin2026';

    if (password.trim() === secretAdminPass.trim()) {
      // Generate a simple timestamped session token
      const sessionToken = Buffer.from(`admin_session_${Date.now()}_${Math.random()}`).toString('base64');

      return NextResponse.json({
        success: true,
        token: sessionToken,
        message: 'Admin erfolgreich authentifiziert.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ungültiges Admin-Passwort.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Serverfehler.' },
      { status: 500 }
    );
  }
}
