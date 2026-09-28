const env = import.meta.env;

export const backendApi = (env.VITE_BACKEND_API || env.BACKEND_API || '') as string;

export const firebaseConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || '') as string,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || '') as string,
  projectId: (env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '') as string,
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || '') as string,
  messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || '') as string,
  appId: (env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || '') as string,
};