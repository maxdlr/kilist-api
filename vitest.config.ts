import { defineConfig } from "vitest/config";
import path from "path";
import swc from "unplugin-swc";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // Test files share one physical test database. Running them in parallel means
    // multiple workers call AppDataSource.initialize() (synchronize: true) concurrently
    // against the same schema, causing "Table already exists" races.
    fileParallelism: false,
  },
  resolve: {
    // Mirrors the "@/*" -> "src/*" path alias from tsconfig.json so Vitest's
    // Vite-based resolver can find imports that use the alias (e.g. FoodRepository.ts).
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    // Vitest's default esbuild transform doesn't emit TypeScript decorator
    // metadata, which TypeORM entities rely on at runtime. SWC does, when
    // configured with decoratorMetadata, so we swap the transform for it.
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { decoratorMetadata: true, legacyDecorator: true },
      },
    }),
  ],
});
