import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// ==============================================================================
// Cliente de Administración de Supabase
// Omite la seguridad a nivel de fila (RLS) usando service_role_key directamente.
// NO lee cookies de usuario para no ser anulado por sesiones JWT individuales.
// Usar exclusivamente en operaciones administrativas de servidor (Server Components y API Routes).
// ==============================================================================
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

// ==============================================================================
// Cliente del Servidor de Autenticación de Supabase
// Utilizado para verificar la sesión y cookies de autenticación del usuario.
// ==============================================================================
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Invocado desde un Server Component — seguro de ignorar
          }
        },
      },
    }
  );
}
