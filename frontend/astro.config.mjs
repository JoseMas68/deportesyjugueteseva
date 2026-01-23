import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// Detectar si estamos en Vercel
const isVercel = process.env.VERCEL === '1';

export default defineConfig({
  integrations: [tailwind()],
  server: {
    port: 4321,
    host: true
  },
  output: 'server',
  // Usar adaptador de Vercel en producción, Node en desarrollo local
  adapter: isVercel ? vercel() : node({ mode: 'standalone' }),
});
