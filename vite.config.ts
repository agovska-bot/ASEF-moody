
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Vercel sets variables in process.env during the build command.
  // We prioritize process.env.API_KEY which is where Vercel injects it.
  const apiKey = process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || "";

  return {
    plugins: [react()],
    define: {
      // Direct replacement for the browser environment
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  }
})
