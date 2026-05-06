import { defineConfig } from "astro/config";
import awsAmplify from "astro-aws-amplify";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: awsAmplify(),
  server: { port: 4322, host: "localhost" },
  // Astro 5 ships a same-origin CSRF check for SSR POSTs that compares
  // request.url's host against the Origin header. Behind CloudFront → Lambda
  // the inner Astro server only sees localhost:3000 as request.url, so the
  // host never matches the public Origin and every POST gets rejected. Auth
  // is handled by Google OAuth + HttpOnly cookies + RLS, so disabling this
  // is safe.
  security: { checkOrigin: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
