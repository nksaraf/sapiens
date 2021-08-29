import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import windicss from "vite-plugin-windicss";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), reactRefresh(), windicss(),],
  server: {
    hmr: {
      // port: 443
    }
  }
});
