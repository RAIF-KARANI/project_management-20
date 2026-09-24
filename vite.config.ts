import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    // port removed so Vite will use its default or process.env.PORT
    fs: {
      allow: [
        path.resolve(__dirname, "client"),
        path.resolve(__dirname, "shared"),
        path.resolve(__dirname) // allow project root (so index.html at repo root is served)
      ],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  // Only apply the GitHub Pages subpath base for production builds.
  // Using it in dev breaks module script loading since index.html
  // references entry scripts via root-absolute paths (e.g. /client/App.tsx).
  base: command === "build" ? "/project_management-20/" : "/",
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));


function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Mount BEFORE Vite's own middlewares (createServer() only defines
      // /api/* routes, no catch-all). This lets Express claim /api/* first;
      // everything else falls through to Vite. Mounting this after Vite's
      // internals instead would let Vite's htmlFallbackMiddleware rewrite
      // unmatched GET requests (including /api/* calls, since browser
      // fetch() sends "Accept: */*" by default) to /index.html before
      // Express ever sees them, breaking every API response.
      server.middlewares.use(app);
    },
  };
}
