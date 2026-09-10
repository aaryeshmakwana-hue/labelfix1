import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import JavaScriptObfuscator from 'javascript-obfuscator';

/**
 * Controlled obfuscation plugin for proprietary LabelFix PDF processing engines:
 * - Meesho label processing & promotional placement (src/utils/pdfEngine.ts)
 * - Flipkart label detection & cropping calculations (src/utils/flipkartEngine.ts)
 * - Amazon pipeline orchestration (src/amazon/amazonProcessor.ts)
 * - Amazon invoice extraction & SKU parsing (src/amazon/amazonInvoiceExtractor.ts)
 * - Amazon label rendering & coordinate math (src/amazon/amazonLabelRenderer.ts)
 *
 * Runs exclusively during production build (apply: 'build').
 * Does NOT touch React, UI components, third-party PDF libraries, or dev server.
 * Uses safe, performance-optimized settings (no control flow flattening, no dead code injection).
 */
function proprietaryEngineProtectionPlugin(): Plugin {
  return {
    name: 'labelfix-proprietary-protection',
    enforce: 'post',
    apply: 'build',
    transform(code: string, id: string) {
      const normalizedId = id.replace(/\\/g, '/');

      const isProprietaryModule =
        normalizedId.includes('src/utils/pdfEngine') ||
        normalizedId.includes('src/utils/flipkartEngine') ||
        normalizedId.includes('src/amazon/amazonProcessor') ||
        normalizedId.includes('src/amazon/amazonInvoiceExtractor') ||
        normalizedId.includes('src/amazon/amazonLabelRenderer');

      if (!isProprietaryModule) {
        return null;
      }

      try {
        const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
          compact: true,
          controlFlowFlattening: false,
          deadCodeInjection: false,
          debugProtection: false,
          disableConsoleOutput: false,
          identifierNamesGenerator: 'mangled',
          numbersToExpressions: false,
          renameGlobals: false,
          rotateStringArray: true,
          selfDefending: false,
          shuffleStringArray: true,
          splitStrings: false,
          stringArray: true,
          stringArrayEncoding: ['base64'],
          stringArrayThreshold: 0.8,
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
          sourceMap: false,
        });

        return {
          code: obfuscationResult.getObfuscatedCode(),
          map: null,
        };
      } catch (err) {
        console.error('[proprietary-protection] Obfuscation transform warning:', err);
        return null;
      }
    },
  };
}

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isProduction ? [proprietaryEngineProtectionPlugin()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      cssMinify: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('pdfjs-dist') || id.includes('pdf-lib')) {
                return 'vendor-pdf';
              }
              if (id.includes('react') || id.includes('motion') || id.includes('lucide-react')) {
                return 'vendor-ui';
              }
            }
          },
        },
      },
    },
    esbuild: {
      drop: isProduction ? ['debugger'] : [],
      pure: isProduction ? ['console.log', 'console.debug', 'console.info'] : [],
      legalComments: 'none',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
