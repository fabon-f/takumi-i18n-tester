import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  // hack to avoid Satori error
  // https://github.com/vercel/satori/issues/738
  define: {
    process: JSON.stringify({ env: {} }),
  },
});
