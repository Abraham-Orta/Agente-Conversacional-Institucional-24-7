import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ==============================================================================
// Middleware: Protección de Rutas para /admin/*
// Se ejecuta en el Edge (servidor) antes de renderizar cualquier página.
// Valida la cookie de sesión de Supabase y verifica el flag is_admin.
// ==============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir libre acceso a la ruta de inicio de sesión /admin/login
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Interceptar únicamente rutas que inicien con /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión activa → redirigir a inicio de sesión
  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Con sesión activa pero sin rol de administrador → redirigir al inicio público
  const isAdmin = user.app_metadata?.is_admin === true;
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
