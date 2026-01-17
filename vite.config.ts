
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load all environment variables from the current directory, regardless of prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Sanitize the API Key: prioritize Vercel's injected process.env, then fall back to .env files.
  let apiKey = (process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || "").trim();
  
  // Clean up potential surrounding quotes that can be introduced by some CI environments.
  apiKey = apiKey.replace(/^["'](.+)["']$/, '$1');

  return {
    plugins: [react()],
    define: {
      // This globally replaces "process.env.API_KEY" in the source code with the actual key string.
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  }
})
