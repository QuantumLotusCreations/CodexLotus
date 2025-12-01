import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react(), vanillaExtractPlugin()],
  build: {
    target: ["es2021", "chrome100", "safari14"],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  optimizeDeps: {
    include: ["react-force-graph-2d"]
  }
}));
