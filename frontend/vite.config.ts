import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      ssr: false,
      server: {
        preset: "node-server",
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
