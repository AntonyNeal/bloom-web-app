import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function criticalCssInline(): Plugin {
  let criticalCss = '';

  return {
    name: 'critical-css-inline',
    buildStart() {
      // Read the critical CSS file
      const criticalCssPath = resolve(__dirname, '../../src/critical.css');
      try {
        criticalCss = readFileSync(criticalCssPath, 'utf-8');
        console.log(
          `[CRITICAL CSS] Inlined ${criticalCss.length} characters of critical CSS`
        );
      } catch {
        console.warn(
          'Critical CSS file not found at',
          criticalCssPath,
          'skipping inlining'
        );
      }
    },
    transformIndexHtml(html) {
      let modifiedHtml = html;

      if (criticalCss) {
        // Inline critical CSS in the head
        modifiedHtml = modifiedHtml.replace(
          '<head>',
          `<head>
    <style>${criticalCss}</style>`
        );
      }

      // Replace render-blocking CSS links with lazy loading script
      // Load CSS after page load to eliminate render-blocking resources
      modifiedHtml = modifiedHtml.replace(
        /<link[^>]*rel="stylesheet"[^>]*href="([^"]*index-[^"]*\.css)"[^>]*>/g,
        (_match, href) => {
          return `<script>
            (function() {
              // Load CSS after page has fully loaded
              window.addEventListener('load', function() {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '${href}';
                document.head.appendChild(link);
              });
            })();
          </script>`;
        }
      );

      return modifiedHtml;
    },
    generateBundle(_options, bundle) {
      // Find CSS chunks and modify them to exclude critical styles
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          // Remove critical styles from the main CSS bundle
          // This is a simple approach - in production you'd want more sophisticated CSS analysis
          const cssContent = chunk.source as string;

          // Remove the critical styles from the main bundle
          // For now, we'll use a simple marker-based approach
          if (
            cssContent.includes('/* Critical CSS for above-the-fold content */')
          ) {
            // Split by the critical CSS marker and keep only the non-critical part
            const parts = cssContent.split(
              '/* Critical CSS for above-the-fold content - Life Psychology Australia */'
            );
            if (parts.length > 1) {
              // Keep everything after the critical CSS
              chunk.source = parts
                .slice(1)
                .join(
                  '/* Critical CSS for above-the-fold content - Life Psychology Australia */'
                );
            }
          }
        }
      }
    },
  };
}
