import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import os from "os";

// Auto-detect LAN IP so the dev server is reachable from a phone
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const ifaces of Object.values(interfaces)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}

const LOCAL_IP = getLocalIP();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  // In dev: proxy to local FastAPI. In production: Vercel rewrites /api/* to Railway.
  const isDev = mode === "development";
  const backendTarget = env.VITE_API_URL || "http://127.0.0.1:8000";

  return {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: ["assets/images/logo.jfif", "assets/fonts/*.ttf"],
        manifest: {
          name: "Merry's Way Coffee",
          short_name: "Merry's Way",
          description: "Craft coffee & fresh pastries — order ahead from Merry's Way Greenwich Village.",
          theme_color: "#0b0b0f",
          background_color: "#0b0b0f",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/assets/images/pwa-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/assets/images/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,ttf,woff,woff2,jfif}"],
          navigateFallback: null,
          runtimeCaching: [
            {
              // Never cache API calls — always hit network
              urlPattern: /^\/api\//,
              handler: "NetworkOnly",
            },
            {
              urlPattern: /\/assets\/images\//,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
          ],
        },
        // Enable PWA in dev so you can test install prompt locally
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],

    server: {
      port: 5173,
      host: true, // 0.0.0.0 — required for phone access on same Wi-Fi
      ...(isDev && {
        proxy: {
          "/api": {
            target: backendTarget,
            changeOrigin: true,
            cookieDomainRewrite: "",
            configure: (proxy) => {
              proxy.on("proxyRes", (proxyRes, req) => {
                const sc = proxyRes.headers["set-cookie"];
                if (Array.isArray(sc)) {
                  const host = (req.headers["host"] ?? LOCAL_IP).split(":")[0];
                  proxyRes.headers["set-cookie"] = sc.map((c) =>
                    c
                      .replace(/;\s*Secure/gi, "")
                      .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
                      .replace(/;\s*Domain=[^;]*/gi, `; Domain=${host}`)
                  );
                }
              });
            },
          },
        },
      }),
    },

    build: {
      // Produce smaller chunks for faster mobile load
      target: "es2020",
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [],
          },
        },
      },
    },
  };
});
