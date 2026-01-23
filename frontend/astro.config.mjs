import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  integrations: [tailwind()],
  server: {
    port: 4321,
    host: true
  },
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
});
