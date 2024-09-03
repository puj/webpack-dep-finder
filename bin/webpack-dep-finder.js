#!/usr/bin/env node
const { program } = require("commander");
const path = require("path");
const fs = require("fs");
const WebpackDepFinder = require("../lib/plugin");
const tsNode = require("ts-node");

// Array of possible webpack config filenames
const configFilenames = [
    "webpack.config.js",
    "webpack.config.ts",
    "webpack.config.dev.js",
    "webpack.config.prod.js",
    "webpackfile.js"
    // Add more patterns as needed
];

async function runWebpackDepFinder({ dependencyPattern, bail, configPath }) {
    // Convert the dependency pattern string to a RegExp
    let pattern;
    try {
        pattern = new RegExp(dependencyPattern);
    } catch (error) {
        console.error("Error: Invalid regular expression provided for dependency-pattern.");
        process.exit(1);
    }

    let webpackConfig;
    if (configPath) {
        // If a specific config path is provided, attempt to load it directly
        webpackConfig = loadWebpackConfig(path.resolve(process.cwd(), configPath));
    } else {
        // Attempt to find and load a webpack config using common filenames
        webpackConfig = findAndLoadWebpackConfig();
    }

    if (!webpackConfig) {
        console.error("Error: No valid Webpack configuration found.");
        process.exit(1);
    }

    // Detect the correct version of Webpack to use
    let Webpack;
    const localWebpackPath = path.resolve(process.cwd(), "node_modules", "webpack");

    if (fs.existsSync(localWebpackPath)) {
        console.log("Using local Webpack from", localWebpackPath);
        Webpack = require(localWebpackPath);
    } else {
        console.log("No local Webpack found, using global Webpack.");
        try {
            Webpack = require("webpack");
        } catch (error) {
            console.error("Error: Webpack is not installed globally or locally.");
            process.exit(1);
        }
    }

    // Add the WebpackDepFinder plugin to the Webpack configuration
    const plugin = new WebpackDepFinder({ dependencyPattern: pattern, bail });
    webpackConfig.plugins = webpackConfig.plugins || [];
    webpackConfig.plugins.push(plugin);

    // Trigger the Webpack compilation process
    const compiler = Webpack(webpackConfig);

    compiler.run((err, stats) => {
        if (err) {
            console.error("Error during the Webpack compilation:", err);
            process.exit(1);
        }

        if (stats.hasErrors()) {
            console.error("Webpack compilation errors:", stats.toJson().errors);
            process.exit(1);
        }

        console.log("Webpack compilation completed successfully.");
        process.exit(0);
    });
}

function loadWebpackConfig(configPath) {
    try {
        tsNode.register({ transpileOnly: true }); // Register ts-node for TypeScript support
        let config = require(configPath);

        // If config is a function, call it
        if (typeof config === "function") {
            config = config({});
        }

        // If config is an array, select the first config (for multi-config setups)
        if (Array.isArray(config)) {
            config = config[0];
        }

        if (typeof config === "object") {
            return config;
        } else {
            throw new Error(`Invalid configuration format in ${configPath}`);
        }
    } catch (error) {
        console.error(`Error loading Webpack config file at ${configPath}:`, error);
        return null;
    }
}

function findAndLoadWebpackConfig() {
    for (const filename of configFilenames) {
        const resolvedPath = path.resolve(process.cwd(), filename);
        if (fs.existsSync(resolvedPath)) {
            console.log(`Found Webpack config file: ${resolvedPath}`);
            return loadWebpackConfig(resolvedPath);
        }
    }
    return null;
}

const getVersion = () => {
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
    const pkg = JSON.parse(packageJson);
    return pkg.version;
};

// Only run the CLI parsing when the script is executed directly
if (require.main === module) {
    program
        .requiredOption(
            "-d, --dependency-pattern <pattern>",
            "Regex pattern to match the resource path/filename to locate."
        )
        .option("-b, --bail", "Stop searching as soon as the dependency is found.", true)
        .option("-c, --config <path>", "Path to the Webpack configuration file.")
        .version(getVersion())
        .parse(process.argv);

    const options = program.opts();
    runWebpackDepFinder({
        dependencyPattern: options.dependencyPattern,
        bail: options.bail,
        configPath: options.config
    });
}

module.exports = { runWebpackDepFinder };
