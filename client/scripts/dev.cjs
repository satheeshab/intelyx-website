/**
 * Starts the webpack development server (npm run dev -w client) on http://localhost:5173.
 *
 * It uses the dev server's Node API instead of `webpack serve`, so it finds webpack-dev-server
 * wherever npm installed it (npm may nest it under client/node_modules because it brings its own
 * Express 4, while the server uses Express 5).
 *
 * A library inside webpack-dev-server still calls an API that Node has deprecated (DEP0060), which
 * prints a scary but harmless warning on every start; warnings are silenced for this process only.
 */
process.noDeprecation = true;

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const createConfig = require('../webpack.config.cjs');

const config = createConfig({}, { mode: 'development' });
config.mode = 'development';

const compiler = webpack(config);
const server = new WebpackDevServer(config.devServer, compiler);

server.start().catch((err) => {
  console.error(err.code === 'EADDRINUSE'
    ? `\nPort ${config.devServer.port} is already in use. Close the other program or dev server and try again.\n`
    : err);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.stop().finally(() => process.exit(0)));
}
