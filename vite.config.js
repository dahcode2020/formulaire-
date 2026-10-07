import { defineConfig } from "vite";

const previewHosts = [".e2b.app", ".webcontainer-api.io"];

export default defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: previewHosts,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: previewHosts,
  },
});
