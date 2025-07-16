import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // CommonJS build
  {
    input: 'src/index.js',
    external: ['d3'],
    output: {
      file: 'dist/family-chart-mongodb.cjs', // Fixed path
      format: 'cjs',
      exports: 'default'
    },
    plugins: [
      resolve({ preferBuiltins: false }),
      commonjs(),
      production && terser()
    ],
    onwarn(warning, warn) {
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      warn(warning);
    }
  },
  
  // ES Module build
  {
    input: 'src/index.js',
    external: ['d3'],
    output: {
      file: 'dist/family-chart-mongodb.esm.js', // Fixed path
      format: 'es'
    },
    plugins: [
      resolve({ preferBuiltins: false }),
      commonjs(),
      production && terser()
    ],
    onwarn(warning, warn) {
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      warn(warning);
    }
  },

  // UMD build (for browsers)
  {
    input: 'src/index.js',
    external: ['d3'],
    output: {
      file: 'dist/family-chart-mongodb.umd.js',
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