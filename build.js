import esbuild from "esbuild";
import sassPlugin from "esbuild-plugin-sass";

esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  outdir: "dist",
  plugins: [sassPlugin()],
});
