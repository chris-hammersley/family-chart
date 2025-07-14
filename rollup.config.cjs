import {terser} from "rollup-plugin-terser";
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import * as meta from "./package.json";

const config = {
  input: "src/index.js",
  external: Object.keys(meta.dependencies || {}),
  plugins: [
    resolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs()
  ],
  output: [
    // CommonJS build
    {
      file: `dist/${meta.name}.cjs.js`,
      format: 'cjs',
      exports: 'default',
      indent: false,
      banner: `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`,
      globals: Object.assign({}, ...Object.keys(meta.dependencies || {}).map(key => ({[key]: key})))
    }
  ]
};

export default config;
