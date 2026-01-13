/*
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// eslint-disable-next-line import/no-unresolved
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'url';

// The default is es2020, but we need es2022 or later because Web Forms uses
// top-level await.
const buildTarget = 'es2022';

// =============================================================================
// THEO COLLECT - API Proxy Configuration
// Proxy requests to ODK Central backend at www.job-tracker.fr
// =============================================================================

// Target ODK Central server
const ODK_CENTRAL_SERVER = 'https://job-tracker.fr';

// Requests to forward to ODK Central backend
const proxyPaths = [
  '/v1',
  '/-',
  '/enketo-passthrough',
  '/client-config.json',
  '/version.txt'
];

// Create proxy configuration for each path
const createProxyConfig = (target) => ({
  target,
  changeOrigin: true,
  secure: true,
  // Preserve cookies for authentication
  cookieDomainRewrite: '',
  // Forward the host header
  headers: {
    'X-Forwarded-Host': new URL(target).host
  }
});

const devServer = {
  port: 8989,
  proxy: Object.fromEntries(
    proxyPaths.map(path => [path, createProxyConfig(ODK_CENTRAL_SERVER)])
  ),
  // Allow CORS since we're proxying to external server
  cors: true
};

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
      compositionOnly: false,
      defaultSFCLang: 'json5',
      // We install what we need in src/container.js.
      fullInstall: false,
      dropMessageCompiler: true
    })
  ],
  build: {
    target: buildTarget,
    // `false` during dev for performance reasons
    reportCompressedSize: mode === 'production',
    cssCodeSplit: false
  },
  // Not sure why this is needed in addition to build.target above and why it's
  // only an issue in development. `npm run dev` doesn't work without this.
  optimizeDeps: mode === 'development'
    ? { esbuildOptions: { target: buildTarget } }
    : {},
  server: devServer
}));
