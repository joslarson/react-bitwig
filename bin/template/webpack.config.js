const path = require('path');

const BitwigWebpackPlugin = require('bitwig-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const tsconfig = require('./tsconfig.json');

const glob = require('glob').globSync;

const entries = glob('./src/*.control.+(tsx|ts|js|jsx)', { dotRelative: true })
  .map((filePath) => filePath.split('.').slice(0, -1).join('.'))
  .reduce((acc, filePath) => {
    acc[path.basename(filePath)] = filePath;
    return acc;
  }, {});

const paths = Array.from(
  new Set([].concat(...tsconfig.include.map((p) => glob(p))))
).filter((p) => /\.(t|j)sx?$/.test(p) && !/\.control\.(t|j)sx?$/.test(p));
const perFileCacheGroups = paths.reduce((result, p, i) => {
  const name = p
    .split('.')
    .slice(0, -1)
    .join('.')
    .replace(
      new RegExp(`^${path.join(tsconfig.compilerOptions.rootDir)}`),
      'project-files'
    );
  result[`file${i + 1}`] = {
    name,
    test: RegExp(path.join(__dirname, p)),
    chunks: 'initial',
    enforce: true,
  };
  return result;
}, {});

module.exports = (_, { mode = 'production' }) => ({
  mode,
  entry: entries,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    globalObject: 'globalThis',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // setup typescript loader for ts and js files
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new BitwigWebpackPlugin(), // enables synchronous code splitting
    new CopyWebpackPlugin({ patterns: [{ from: 'README.md' }] }), // non JS things to copy
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        // in dev mode output a chunk per src file to make debugging easier
        ...(mode === 'development' ? perFileCacheGroups : {}),
        // separate webpack manifest and vendor libs from project code
        vendor: {
          name: 'vendor.bundle',
          test: /node_modules/,
          chunks: 'initial',
          enforce: true,
        },
      },
    },
    runtimeChunk: { name: "runtime" },
    // makes output easy to read for debugging
    concatenateModules: true,
  },
  devtool: false, // sourcemaps not supported in Bitwig's JavaScript engine
  stats: {
    assets: false,
    colors: true,
    chunks: false,
    version: false,
    hash: false,
    timings: false,
    modules: false,
    builtAt: false,
    cached: false,
    entrypoints: true,
    reasons: false,
    errors: true,
  },
});
