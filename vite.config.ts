import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const getEnv = (key: string) => env[`VITE_${key}`] || env[key] || ''

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    define: {
      'import.meta.env.VITE_BACKEND_API': JSON.stringify(getEnv('BACKEND_API')),
      'import.meta.env.BACKEND_API': JSON.stringify(getEnv('BACKEND_API')),

      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(getEnv('FIREBASE_API_KEY')),
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(getEnv('FIREBASE_API_KEY')),

      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(getEnv('FIREBASE_AUTH_DOMAIN')),
      'import.meta.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(getEnv('FIREBASE_AUTH_DOMAIN')),

      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(getEnv('FIREBASE_PROJECT_ID')),
      'import.meta.env.FIREBASE_PROJECT_ID': JSON.stringify(getEnv('FIREBASE_PROJECT_ID')),

      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(getEnv('FIREBASE_STORAGE_BUCKET')),
      'import.meta.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(getEnv('FIREBASE_STORAGE_BUCKET')),

      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(getEnv('FIREBASE_MESSAGING_SENDER_ID')),
      'import.meta.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(getEnv('FIREBASE_MESSAGING_SENDER_ID')),

      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(getEnv('FIREBASE_APP_ID')),
      'import.meta.env.FIREBASE_APP_ID': JSON.stringify(getEnv('FIREBASE_APP_ID')),
    },
  }
})


