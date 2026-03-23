export default {
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
};
