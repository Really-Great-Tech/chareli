import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

const manualChunkGroups = [
  {
    name: "framework",
    patterns: ["react", "react-dom", "scheduler", "react/jsx-runtime"],
  },
  {
    name: "router",
    patterns: ["react-router", "react-router-dom", "@remix-run/router"],
  },
  {
    name: "state",
    patterns: ["@reduxjs/toolkit", "react-redux", "@tanstack/react-query"],
  },
  {
    name: "http",
    patterns: ["axios", "socket.io-client"],
  },
  {
    name: "ui-kit",
    patterns: [
      "@radix-ui",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "cmdk",
    ],
  },
  {
    name: "forms",
    patterns: [
      "react-hook-form",
      "@hookform/resolvers",
      "formik",
      "yup",
      "zod",
    ],
  },
  {
    name: "icons",
    patterns: ["react-icons", "lucide-react", "react-circle-flags"],
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
      "country-data-list",
    ],
  },
  {
    name: "date-utils",
    patterns: ["date-fns", "react-day-picker"],
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
  {
    name: "pdf",
    patterns: ["pdfmake"],
  },
  {
    name: "excel",
    patterns: ["xlsx"],
  },
  {
    name: "ui-components",
    patterns: [
      "react-otp-input",
      "react-resizable-panels",
      "sonner",
      "next-themes",
    ],
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

  // Split remaining vendor code into smaller chunks based on package name
  const nodeModulesPath = normalizedId.split("/node_modules/").pop();
  if (nodeModulesPath) {
    // Extract package name (handle scoped packages like @babel/runtime)
    const packageName = nodeModulesPath.startsWith("@")
      ? nodeModulesPath.split("/").slice(0, 2).join("/")
      : nodeModulesPath.split("/")[0];

    // Group into vendor-{first-letter} chunks to distribute the load
    const firstChar = packageName.replace("@", "").charAt(0).toLowerCase();
    return `vendor-${firstChar}`;
  }

  return "vendor-misc";
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
