import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart({ startup }) {
          // VSCode/Trae sets ELECTRON_RUN_AS_NODE=1 which prevents Electron from loading properly
          delete process.env.ELECTRON_RUN_AS_NODE
          startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'node-pty', 'ssh2'],
              output: {
                format: 'cjs'
              }
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                format: 'cjs'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  },
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist'
  }
})
