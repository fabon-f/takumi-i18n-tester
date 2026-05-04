import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["eslint", "typescript", "react", "react-perf", "oxc", "import"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
