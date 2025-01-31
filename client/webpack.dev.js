"use strict";

const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");
const path = require("path");

module.exports = merge(common, {
    mode: "development",
    entry: ["webpack-hot-middleware/client?reload=true", "./src/index.js"],
    devServer: {
        contentBase: "./src",
        watchContentBase: true,
        inline: true,
        port: 3000,
        hot: true,
    },
    watchOptions: {
        poll: 1000,
        ignored: ["node_modules"],
    },
    devtool: "cheap-module-source-map",
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.WatchIgnorePlugin([/css\.d\.ts$/]),
        new webpack.EnvironmentPlugin({ CODEX_SERVER_URL: "http://localhost:8000/server" }),
    ],
    resolve: {
        modules: [
            path.resolve(__dirname, "src/"),
            "node_modules",
            path.resolve(__dirname, "src/react-cristal/src/"),
        ],
        extensions: [".ts", ".tsx", ".js", ".json"],
        alias: { "react-dom": "@hot-loader/react-dom" },
    },
});
