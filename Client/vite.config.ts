import { defineConfig } from 'vite';
import type { PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react(), tailwindcss()];

  if (mode === 'analyze' || process.env.ANALYZE === 'true') {
    plugins.push(
      visualizer({
        filename: 'dist/bundle-analysis.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: true,
      })
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Keep React and React-DOM together in one chunk
            'react-core': ['react', 'react-dom', 'react/jsx-runtime'],
            'react-router': ['react-router-dom'],
            'ui-radix': [
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip',
            ],
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  };
});

// import { defineConfig } from "vite";
// import type { PluginOption } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
// import path from "path";
// import { visualizer } from "rollup-plugin-visualizer";

// const manualChunkGroups = [
//   {
//     name: "framework",
//     patterns: ["react-dom", "scheduler", "react-is"],
//   },
//   {
//     name: "router",
//     patterns: ["react-router", "react-router-dom", "@remix-run/router"],
//   },
//   {
//     name: "state",
//     patterns: ["@reduxjs/toolkit", "react-redux", "@tanstack/react-query"],
//   },
//   {
//     name: "http",
//     patterns: ["axios", "socket.io-client"],
//   },
//   {
//     name: "ui-kit",
//     patterns: [
//       "@radix-ui",
//       "class-variance-authority",
//       "clsx",
//       "tailwind-merge",
//       "cmdk",
//     ],
//   },
//   {
//     name: "forms",
//     patterns: [
//       "react-hook-form",
//       "@hookform/resolvers",
//       "formik",
//       "yup",
//       "zod",
//     ],
//   },
//   {
//     name: "icons",
//     patterns: ["react-icons", "lucide-react", "react-circle-flags"],
//   },
//   {
//     name: "select",
//     patterns: ["react-select"],
//   },
//   {
//     name: "phone-input",
//     patterns: [
//       "react-phone-input-2",
//       "react-international-phone",
//       "libphonenumber-js",
//       "country-data-list",
//     ],
//   },
//   {
//     name: "date-utils",
//     patterns: ["date-fns", "react-day-picker"],
//   },
//   {
//     name: "charts",
//     patterns: ["recharts"],
//   },
//   {
//     name: "carousel",
//     patterns: ["embla-carousel", "embla-carousel-react"],
//   },
//   {
//     name: "uploads",
//     patterns: ["@uppy"],
//   },
//   {
//     name: "pdf",
//     patterns: ["pdfmake"],
//   },
//   {
//     name: "excel",
//     patterns: ["xlsx"],
//   },
//   {
//     name: "ui-components",
//     patterns: [
//       "react-otp-input",
//       "react-resizable-panels",
//       "sonner",
//       "next-themes",
//     ],
//   },
// ] as const;
// const resolveManualChunk = (id: string) => {
//   const normalizedId = id.replace(/\\/g, "/");
//   if (!normalizedId.includes("/node_modules/")) {
//     return null;
//   }

//   // Handle core React package separately with exact matching
//   // to avoid matching react-select, react-redux, etc.
//   if (
//     normalizedId.includes("/node_modules/react/") ||
//     normalizedId.includes("/node_modules/react-dom/") ||
//     normalizedId.includes("/node_modules/scheduler/") ||
//     normalizedId.includes("/node_modules/react-is/")
//   ) {
//     return "framework";
//   }

//   const match = manualChunkGroups.find(({ patterns }) =>
//     patterns.some((pattern) =>
//       normalizedId.includes(`/node_modules/${pattern}/`)
//     )
//   );

//   if (match) {
//     return match.name;
//   }

//   return "vendor";
// };

// // https://vite.dev/config/
// export default defineConfig(({ mode }) => {
//   const plugins: PluginOption[] = [react(), tailwindcss()];

//   if (mode === "analyze" || process.env.ANALYZE === "true") {
//     // Generate an interactive treemap to understand bundle composition
//     plugins.push(
//       visualizer({
//         filename: "dist/bundle-analysis.html",
//         template: "treemap",
//         gzipSize: true,
//         brotliSize: true,
//         open: true,
//       })
//     );
//   }

//   return {
//     plugins,
//     resolve: {
//       alias: {
//         "@": path.resolve(__dirname, "src"),
//       },
//     },
//     build: {
//       rollupOptions: {
//         output: {
//           manualChunks(id) {
//             return resolveManualChunk(id) ?? undefined;
//           },
//         },
//       },
//       minify: "esbuild",
//       esbuildOptions: {
//         drop: ["console", "debugger"],
//         legalComments: "none",
//       },
//     },
//   };
// });
