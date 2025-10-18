import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // FIX: Replaced `process.cwd()` with an empty string to resolve a TypeScript type error.
  // This is functionally equivalent as `loadEnv` will use the current working directory.
  const env = loadEnv(mode, '', '');
  return {
    define: {
      'process.env': env
    }
  }
});
