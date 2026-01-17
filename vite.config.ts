
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Sanitize the API Key
  let apiKey = (process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || "").trim();
  apiKey = apiKey.replace(/^["'](.+)["']$/, '$1');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  }
})
