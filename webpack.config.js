const path = require("path");
const nodeExternals = require("webpack-node-externals");
const { mode } = require("./test/webpack.config");

module.exports = {
    mode: "production",
    entry: {
        cli: "./bin/webpack-dep-finder.js", // Entry point for CLI
        plugin: "./lib/plugin.js" // Entry point for the plugin
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js", // Output files will be named cli.js and plugin.js
        libraryTarget: "umd" // Universal Module Definition
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader", // Transpile ES6+ code with Babel
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    },
    target: "node", // Target Node.js for both CLI and plugin
    externals: [
        nodeExternals() // Exclude node_modules from the bundle
    ],
    resolve: {
        extensions: [".js"] // Resolve .js files
    }
};
