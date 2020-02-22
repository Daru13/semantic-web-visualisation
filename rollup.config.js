import typescript from "rollup-plugin-typescript2"
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";
import pkg from "./package.json"

export default {
  input: "src/ts/main.ts",
  
  output: [
    {
      file: "build/main.min.js",
      format: "umd",
      globals: {
          "popper.js": "popper",
          "tippy.js": "tippy",
        },
      plugins: [terser()]
    },
  ],

  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],

  plugins: [
    typescript({
      typescript: require("typescript"),
      objectHashIgnoreUnknownHack: true,
    }),

    copy({
      targets: [
        { src: "src/css/**/*.css", dest: "build"}
      ]
    }),
  ],
}

