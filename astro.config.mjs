import { defineConfig } from "astro/config";
import awsAmplify from "astro-aws-amplify";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: awsAmplify(),
  server: { port: 4322, host: "localhost" },
  vite: {
    plugins: [tailwindcss()],
  },
});
