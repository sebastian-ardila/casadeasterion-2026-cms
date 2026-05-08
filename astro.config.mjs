import { defineConfig } from "astro/config";
import awsAmplify from "astro-aws-amplify";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

export default defineConfig({
  output: "server",
  adapter: awsAmplify(),
  integrations: [icon()],
  server: { port: 4322, host: "localhost" },
  // Prefetch links on hover so navigations feel instant. Combined with
  // <ClientRouter /> (view transitions) in AppLayout, the sidebar/listpanel
  // persist between pages and only the <main> content swaps in.
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
  // Astro 5 ships a same-origin CSRF check for SSR POSTs that compares
  // request.url's host against the Origin header. Behind CloudFront → Lambda
  // the inner Astro server only sees localhost:3000 as request.url, so the
  // host never matches the public Origin and every POST gets rejected. Auth
  // is handled by Google OAuth + HttpOnly cookies + RLS, so disabling this
  // is safe.
  security: { checkOrigin: false },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // sharp ships native binaries; let Node resolve it at runtime instead of
      // bundling it through Vite (which breaks the .node binary loading).
      external: ["sharp"],
    },
  },
});
