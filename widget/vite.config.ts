import { defineConfig } from "vite"
import preact from "@preact/preset-vite"

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "ChatbotWidget",
      fileName: "widget",
      formats: ["iife"]
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    minify: "esbuild",
    target: "es2017",
    outDir: "dist",
    emptyOutDir: true
  }
})
