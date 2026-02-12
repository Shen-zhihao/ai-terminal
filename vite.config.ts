import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main.ts",
        onstart({ startup }) {
          delete process.env.ELECTRON_RUN_AS_NODE;
          startup();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron", "node-pty", "ssh2"],
              output: {
                format: "cjs",
              },
            },
          },
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              output: {
                format: "cjs",
              },
            },
          },
        },
      },
    ]),
    renderer(),
    // 打包分析插件
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    // 启用压缩
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 将大型依赖单独打包
          "vendor-react": ["react", "react-dom"],
          "vendor-xterm": [
            "@xterm/xterm",
            "@xterm/addon-fit",
            "@xterm/addon-web-links",
          ],
          "vendor-openai": ["openai"],
          "vendor-ssh": ["ssh2"],
        },
      },
    },
    // 减少警告阈值
    chunkSizeWarningLimit: 500,
  },
});
