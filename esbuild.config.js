let isDev = false;
if (process.argv.includes("dev")) {
  isDev = true;
}

require("esbuild")
  .build({
    // the entry point file described above
    entryPoints: [
      "index.ts",
    ],
    // the build folder location described above
    outdir: "dist/bundle",
    bundle: true,
    minify: !isDev,
    watch: isDev,
    target: "esnext",
    sourcemap: isDev,
    tsconfig: "tsconfig.json",
  })
  .catch(() => process.exit(1));
