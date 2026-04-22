import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Darbe/",
  server: {
    proxy: {
      "/__darbe_s3_image_proxy": {
        target: "https://darbe-image-video-storage.s3.us-east-1.amazonaws.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__darbe_s3_image_proxy/, ""),
      },
    },
  },
});
