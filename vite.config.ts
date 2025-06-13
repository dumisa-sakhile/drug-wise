import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/n
export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
