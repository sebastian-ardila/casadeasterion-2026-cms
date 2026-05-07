/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly PUBLIC_CMS_URL: string;
  readonly PUBLIC_SITE_AMPLIFY_APP_ID: string;
  readonly AMPLIFY_READER_ACCESS_KEY_ID: string;
  readonly AMPLIFY_READER_SECRET_ACCESS_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: {
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
      role: "owner" | "admin" | "editor" | "viewer";
    } | null;
  }
}
