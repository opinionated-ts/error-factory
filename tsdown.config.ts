import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  exports: true,
  outDir: "dist",
  target: false,
});
