import { createBrowserClient } from "@supabase/ssr";

// ==============================================================================
// Cliente del Navegador de Supabase
// Utiliza la clave pública anónima (anon_key), segura para el cliente.
// Se usa en componentes del navegador para autenticación (login, logout, sesión).
// ==============================================================================

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
