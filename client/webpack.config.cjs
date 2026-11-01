/**
 * Build configuration for the React app (webpack + Babel: plain JavaScript tools, no native binaries).
 *
 *   npm run dev -w client    development server on http://localhost:5173 (forwards /api to the Node server)
 *   npm run build -w client  production build into dist/public, then pre-renders each page's <head>
 */
const path = require('node:path');
const CopyPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const apiPort = process.env.API_PORT || 3001;

  return {
    entry: './src/main.jsx',
    output: {
      // The Express server serves this folder (see server/src/static.js).
      path: path.resolve(__dirname, 'dist/public'),
      publicPath: '/',
      // Production file names contain a hash of their content, so browsers can cache them for a year.
      filename: isProd ? 'assets/[name]-[contenthash:8].js' : 'assets/[name].js',
      clean: true,
    },
    resolve: { extensions: ['.jsx', '.js'] },
    devtool: isProd ? false : 'cheap-module-source-map',
    performance: { hints: false },
    stats: isProd ? 'normal' : 'minimal', // keep the dev terminal readable

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: 'defaults' }],
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.css$/,
          use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', { loader: 'css-loader', options: { url: false } }],
        },
      ],
    },

    plugins: [
      // index.html is the page shell; webpack adds the script and stylesheet tags.
      // minify:false keeps the tags readable for scripts/prerender-head.mjs.
      new HtmlWebpackPlugin({ template: 'index.html', inject: 'head', scriptLoading: 'defer', minify: false }),
      // favicon, robots.txt, theme-init.js and /assets/img/* are copied as they are
      new CopyPlugin({ patterns: [{ from: 'public', to: '.', globOptions: { ignore: ['**/.DS_Store'] } }] }),
      ...(isProd ? [new MiniCssExtractPlugin({ filename: 'assets/[name]-[contenthash:8].css' })] : []),
    ],

    optimization: { minimizer: ['...', new CssMinimizerPlugin()] },

    devServer: {
      port: 5173,
      host: 'localhost',
      hot: false, // reload the whole page on change (simple and reliable)
      liveReload: true,
      historyApiFallback: true, // /about, /contact ... all serve the app
      proxy: [{ context: ['/api'], target: `http://127.0.0.1:${apiPort}` }],
      client: { overlay: { errors: true, warnings: false } },
      setupMiddlewares: (middlewares) => {
        // /about.html -> /about (the production server does the same; see server/src/static.js)
        middlewares.unshift((req, res, next) => {
          if (req.method !== 'GET' || !req.path.endsWith('.html') || req.path === '/index.html') return next();
          const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
          res.redirect(301, req.path.replace(/\.html$/, '') + query);
        });
        return middlewares;
      },
    },
  };
};
