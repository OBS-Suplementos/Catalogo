'use server';

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

interface LoginResult {
  success: boolean;
  error?: string;
}

// Validate admin credentials and create session
export async function login(
  adminId: string,
  password: string
): Promise<LoginResult> {
  const validAdminId = process.env.ADMIN_ID;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validAdminId || !validPassword) {
    console.error('Admin credentials not configured in environment');
    return { success: false, error: 'Error de configuración del servidor' };
  }

  if (adminId !== validAdminId || password !== validPassword) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  // Create session token (simple hash for demo purposes)
  const sessionToken = Buffer.from(
    JSON.stringify({ adminId, timestamp: Date.now() })
  ).toString('base64');

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return { success: true };
}

// Clear session and logout
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Check if user has valid session
export async function getSession(): Promise<{
  isAuthenticated: boolean;
  adminId?: string;
}> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return { isAuthenticated: false };
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );

    // Validate that the adminId matches
    if (decoded.adminId === process.env.ADMIN_ID) {
      return { isAuthenticated: true, adminId: decoded.adminId };
    }
  } catch {
    // Invalid token format
  }

  return { isAuthenticated: false };
}

// Verify session (for middleware use)
export async function verifySession(): Promise<boolean> {
  const session = await getSession();
  return session.isAuthenticated;
}
