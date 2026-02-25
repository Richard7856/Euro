import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      },
    },
  });

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    const isRefreshTokenError =
      err && typeof err === 'object' && 'code' in err &&
      (err.code === 'refresh_token_not_found' || (err as { status?: number }).status === 400);
    if (isRefreshTokenError) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      const res = NextResponse.redirect(url);
      request.cookies.getAll().forEach((c) => {
        if (c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) {
          res.cookies.set(c.name, '', { maxAge: 0, path: '/' });
        }
      });
      return res;
    }
    throw err;
  }

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isConfigurar2FA = request.nextUrl.pathname === '/configurar-2fa';
  const isPublicApi = request.nextUrl.pathname === '/api/supabase-health';

  if (!user && !isLoginPage && !isConfigurar2FA && !isPublicApi) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = url.searchParams.get('redirect') || '/';
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  // Rutas solo para admin: /perfiles, /usuarios
  const isAdminOnlyRoute = request.nextUrl.pathname.startsWith('/perfiles') || request.nextUrl.pathname.startsWith('/usuarios');
  if (user && isAdminOnlyRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();
    if (profile?.rol !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
