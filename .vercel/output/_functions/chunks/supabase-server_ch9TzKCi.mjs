import { createServerClient, parseCookieHeader } from '@supabase/ssr';

const SUPABASE_URL = undefined                                   ;
const SUPABASE_ANON_KEY = undefined                                        ;
function getSupabaseServerClient(request, cookies) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie") ?? "").filter((c) => c.value !== void 0).map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
            ...options,
            path: options?.path ?? "/"
          });
        });
      }
    }
  });
}

export { getSupabaseServerClient as g };
