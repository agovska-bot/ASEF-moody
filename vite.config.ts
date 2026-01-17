
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables from the current directory and process.env
  const env = loadEnv(mode, process.cwd(), '');
  
  // Priority: Vercel/System ENV > .env file
  const API_KEY_VALUE = process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || "";

  console.log('--- Vite Build Info ---');
  console.log('Target API_KEY length:', API_KEY_VALUE.length);
  
  return {
    plugins: [react()],
    define: {
      // This ensures that any occurrence of process.env.API_KEY in the code 
      // is replaced with the actual string during the build.
      'process.env.API_KEY': JSON.stringify(API_KEY_VALUE),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  }
})
