
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Vercel sets variables in process.env during the build command.
  // We check local .env (VITE_API_KEY), Vercel env (API_KEY), and system process.env.
  const apiKey = env.API_KEY || process.env.API_KEY || env.VITE_API_KEY || "";

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Inject the key safely into the client-side code. 
      // Using an empty string fallback prevents build crashes if the key is missing.
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  }
})
