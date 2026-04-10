import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import eslint from "vite-plugin-eslint"
import solid from "vite-plugin-solid"

export default defineConfig({
  plugins: [
    eslint(),
    solid({ ssr: true }),
  ],
  build: {
    target: "esnext",
  },
  preview: {
    host: "127.0.0.1",
    port: 34667,
    strictPort: true,
    open: false,
  },
})
