/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { glob } from 'glob';

// 獲取所有 lib 目錄下的入口點
const libEntries = glob
  .sync('src/lib/*/index.ts')
  .reduce<Record<string, string>>((entries, path) => {
    // 將路徑轉換為入口點名稱，例如：src/lib/auth/index.ts -> lib/auth
    const entryName = path.replace(/^src\//, '').replace(/\/index\.ts$/, '');
    entries[entryName] = path;
    return entries;
  }, {});

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/shared',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
      // 確保為所有入口點生成類型定義
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // 設定多入口點
      entry: {
        index: 'src/index.ts',
        ...libEntries,
      },
      formats: ['es' as const],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // 確保生成的檔案路徑與匯入路徑匹配
        entryFileNames: (chunkInfo) => {
          return `${chunkInfo.name}.js`;
        },
        // 保持子目錄結構
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
