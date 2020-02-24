import typescript from "rollup-plugin-typescript2"
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";
import pkg from "./package.json"

export default {
  input: "src/ts/main.ts",
  
  output: [
    {
      file: "build/js/main.min.js",
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
        { src: "src/css", dest: "build"},
        { src: "src/demos", dest: "build"},
        { src: "src/fonts", dest: "build"},
        { src: "src/img", dest: "build"},
        { src: "src/lib", dest: "build"},
        { src: "src/index.html", dest: "build"}
      ]
    }),
  ],
}

