import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // CommonJS build
  {
    input: 'src/index.js',
    external: ['d3'], // Don't bundle d3, expect it as external dependency
    output: {
      file: 'dist/@chris-hammersley/family-chart-mongodb.cjs',
      format: 'cjs',
      exports: 'default'
    },
    plugins: [
      resolve({
        preferBuiltins: false
      }),
      commonjs(),
      production && terser()
    ]
  },
  
  // ES Module build
  {
    input: 'src/index.js',
    external: ['d3'],
    output: {
      file: 'dist/@chris-hammersley/family-chart-mongodb.esm.js', 
      format: 'es'
    },
    plugins: [
      resolve({
        preferBuiltins: false
      }),
      commonjs(),
      production && terser()
    ]
  },

  // UMD build (for browsers)
  {
    input: 'src/index.js',
    external: ['d3'],
    output: {
      file: 'dist/@chris-hammersley/family-chart-mongodb.umd.js',
      format: 'umd',
      name: 'FamilyChart',
      globals: {
        'd3': 'd3'
      }
    },
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true
      }),
      commonjs(),
      production && terser()
    ]
  }
];