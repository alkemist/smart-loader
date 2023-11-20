// Generated using webpack-cli https://github.com/webpack/webpack-cli
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: "none",
    entry: "./dist/index.js",
    experiments: {
        outputModule: true
    },
    output: {
        library: {
            type: 'module',
        },
        chunkFormat: 'module',
        module: true,
        path: __dirname + "/lib",
        filename: 'index.min.mjs',
    },
    plugins: [],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            parallel: true,
            terserOptions: {
                module: true
            },
        })],
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                },
            },
        ],
    },
    resolve: {
        extensions: [".js"],
    },
}