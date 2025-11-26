import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

const manualChunkGroups = [
  {
    name: "framework",
    patterns: ["react", "react-dom", "scheduler"],
  },
  {
    name: "router",
    patterns: ["react-router", "react-router-dom", "@remix-run/router"],
  },
  {
    name: "query",
    patterns: ["@tanstack/react-query", "axios"],
  },
  {
    name: "ui-kit",
    patterns: ["@radix-ui", "class-variance-authority", "clsx"],
  },
  {
    name: "forms",
    patterns: ["react-hook-form", "formik", "yup", "zod"],
  },
  {
    name: "icons",
    patterns: ["react-icons", "lucide-react"],
  },
  {
    name: "select",
    patterns: ["react-select"],
  },
  {
    name: "phone-input",
    patterns: [
      "react-phone-input-2",
      "react-international-phone",
      "libphonenumber-js",
    ],
  },
  {
    name: "charts",
    patterns: ["recharts"],
  },
  {
    name: "carousel",
    patterns: ["embla-carousel", "embla-carousel-react"],
  },
  {
    name: "uploads",
    patterns: ["@uppy"],
  },
] as const;

const resolveManualChunk = (id: string) => {
  const normalizedId = id.replace(/\\/g, "/");
  if (!normalizedId.includes("/node_modules/")) {
    return null;
  }

  const match = manualChunkGroups.find(({ patterns }) =>
    patterns.some((pattern) =>
      normalizedId.includes(`/node_modules/${pattern}`)
    )
  );

  if (match) {
    return match.name;
  }

  // return "vendor";
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react(), tailwindcss()];

  if (mode === "analyze" || process.env.ANALYZE === "true") {
    // Generate an interactive treemap to understand bundle composition
    plugins.push(
      visualizer({
        filename: "dist/bundle-analysis.html",
        template: "treemap",
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
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            return resolveManualChunk(id) ?? undefined;
          },
        },
      },
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
    },
  };
});
