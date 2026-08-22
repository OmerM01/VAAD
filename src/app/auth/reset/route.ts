import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Landing point for the link in the password-reset email.
 *
 * Supabase verifies the token on its side and sends the visitor here with a
 * one-time code. Exchanging it establishes a session, which is what allows the
 * next screen to call updateUser({ password }).
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const errorDescription = request.nextUrl.searchParams.get('error_description');

  const url = request.nextUrl.clone();
  url.search = '';

  if (errorDescription || !code) {
    url.pathname = '/forgot-password';
    url.searchParams.set('expired', '1');
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    url.pathname = '/forgot-password';
    url.searchParams.set('expired', '1');
    return NextResponse.redirect(url);
  }

  url.pathname = '/reset-password';
  return NextResponse.redirect(url);
}
