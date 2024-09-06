#!/usr/bin/env node
const { program } = require("commander");
const path = require("path");
const fs = require("fs");
const glob = require("glob");
const WebpackDepFinder = require("../lib/plugin");
const tsNode = require("ts-node");

// Array of possible webpack config filenames
const configFilenames = [
    "webpack.config.js",
    "webpack.config.ts",
    "webpack.config.dev.js",
    "webpack.config.prod.js",
    "webpackfile.js"
];

async function runWebpackDepFinder({
    dependencyPattern,
    haltOnMatch,
    configPath,
    showWebpackOutput,
    entryPoint,
    entryMatch
}) {
    let pattern;
    try {
        pattern = new RegExp(dependencyPattern);
    } catch (error) {
        console.error("Error: Invalid regular expression provided for dependency-pattern.");
        process.exit(1);
    }

    let webpackConfig = configPath
        ? loadWebpackConfig(path.resolve(process.cwd(), configPath))
        : findAndLoadWebpackConfig();

    if (!webpackConfig) {
        console.error("Error: No valid Webpack configuration found.");
        process.exit(1);
    }

    // If --entry-match is provided, search for matching files
    if (entryMatch) {
        const matchedEntry = findMatchingEntry(entryMatch);
        if (matchedEntry) {
            webpackConfig.entry = path.resolve(process.cwd(), matchedEntry);
            console.log(`Using entry point from match: ${webpackConfig.entry}`);
        } else {
            console.error(`Error: No entry point matching "${entryMatch}" was found.`);
            process.exit(1);
        }
    } else if (entryPoint) {
        // Override Webpack's entry point if --entry-point is provided
        webpackConfig.entry = path.resolve(process.cwd(), entryPoint);
        console.log(`Using entry point: ${webpackConfig.entry}`);
    } else {
        console.log(`Entry point module: ${webpackConfig.entry || webpackConfig.entry}`);
    }

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

    const plugin = new WebpackDepFinder({
        dependencyPattern: pattern,
        bail: haltOnMatch,
        squelchWebpackOutput: !showWebpackOutput
    });

    webpackConfig.plugins = webpackConfig.plugins || [];
    webpackConfig.plugins.push(plugin);

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
        tsNode.register({ transpileOnly: true });
        let config = require(configPath);
        if (typeof config === "function") config = config({});
        if (Array.isArray(config)) config = config[0];
        return config;
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

function findMatchingEntry(entryMatch) {
    // Convert entryMatch to a case-insensitive regex if it's not already a regex
    const regex = new RegExp(entryMatch, "i");

    // Search for files that match the given pattern in the source folder
    const matches = glob.sync("**/*", {
        cwd: path.resolve(process.cwd(), "src"), // Search within src directory
        nodir: true // Ensure we only get files, not directories
    });

    // Find the first matching file based on the regex
    return matches.find(file => regex.test(file));
}

const getVersion = () => {
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
    const pkg = JSON.parse(packageJson);
    return pkg.version;
};

// CLI Command Parsing
if (require.main === module) {
    program
        .requiredOption(
            "-d, --dependency-pattern <pattern>",
            "Regex pattern to match the resource path/filename to locate."
        )
        .option("--no-halt-on-match", "Continue searching even after the dependency is found.")
        .option("--show-webpack-output", "Display Webpack's build output.")
        .option("-c, --config <path>", "Path to the Webpack configuration file.")
        .option("--entry-point <path>", "Specify an entry point to begin the search from.")
        .option("--entry-match <pattern>", "Specify a regex or partial string to match the entry point filename.")
        .version(getVersion())
        .parse(process.argv);

    const options = program.opts();
    runWebpackDepFinder({
        dependencyPattern: options.dependencyPattern,
        haltOnMatch: !options.noHaltOnMatch,
        configPath: options.config,
        showWebpackOutput: options.showWebpackOutput,
        entryPoint: options.entryPoint,
        entryMatch: options.entryMatch
    });
}

module.exports = { runWebpackDepFinder };
