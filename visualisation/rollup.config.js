import typescript from "rollup-plugin-typescript2"
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json"

export default {
  input: "src/main.ts",
  
  output: [
    {
      file: "build/main.es.js",
      format: "es",   
    },
    {
      file: "build/main.min.js",
      format: "umd",
      globals: {
        "d3": "d3",
      },
      plugins: [terser()]
    },
  ],

  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],

  plugins: [
    typescript({ typescript: require("typescript") }),
  ],
}

