import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'

const jsExtensions = ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.node']

const scriptConfig = ({ fileBasename, mjs = false }) => {
	const cjs = {
		file: `dist/${fileBasename}.js`,
		format: 'cjs',
		exports: 'named',
	}

	return {
		input: `src/${fileBasename}.ts`,
		output: mjs
			? [
					cjs,
					{
						file: `dist/${fileBasename}.mjs`,
						format: 'esm',
					}
				]
		  : cjs,
		external: [
	    ...Object.keys(require('../package.json').dependencies || {}),
	    ...Object.keys(require('../package.json').devDependencies),
	  ],
		plugins: [
			babel({
				babelrc: true,
				exclude: 'node_modules/**',
				extensions: jsExtensions
			}),
			resolve({
				extensions: jsExtensions
			}),
			commonjs(),
		]
	}
}

module.exports = [
	{ fileBasename: 'index.browser' },
	{ fileBasename: 'index.node', mjs: true }
].map(scriptConfig)
