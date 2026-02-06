import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      // Basic Auth challenge
      'WWW-Authenticate': 'Basic realm="Walden Ridge Ops", charset="UTF-8"',
    },
  });
}

function decodeBasicAuth(authHeader: string): { user: string; pass: string } | null {
  if (!authHeader.startsWith('Basic ')) return null;
  const b64 = authHeader.slice('Basic '.length).trim();
  if (!b64) return null;

  // Next.js middleware runs in the Edge runtime; Buffer is not available.
  // Use atob for base64 decoding.
  const decoded = globalThis.atob(b64);
  const idx = decoded.indexOf(':');
  const user = idx >= 0 ? decoded.slice(0, idx) : decoded;
  const pass = idx >= 0 ? decoded.slice(idx + 1) : '';
  return { user, pass };
}

export function middleware(req: NextRequest) {
  const expectedUser = process.env.BASIC_AUTH_USER || '';
  const expectedPass = process.env.BASIC_AUTH_PASS || '';

  // Fail closed if not configured.
  if (!expectedUser || !expectedPass) return unauthorized();

  const auth = req.headers.get('authorization') || '';

  try {
    const creds = decodeBasicAuth(auth);
    if (!creds) return unauthorized();
    if (creds.user !== expectedUser || creds.pass !== expectedPass) return unauthorized();
    return NextResponse.next();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: '/:path*',
};
