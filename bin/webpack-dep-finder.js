#!/usr/bin/env node

const { program } = require("commander");
const path = require("path");
const fs = require("fs");
const WebpackDepFinder = require("../lib/plugin");

function runWebpackDepFinder({ dependencyPattern, bail, configPath }) {
	// Convert the dependency pattern string to a RegExp
	let pattern;
	try {
		pattern = new RegExp(dependencyPattern);
	} catch (error) {
		console.error("Error: Invalid regular expression provided for `dependency-pattern`.");
		process.exit(1);
	}

	// Resolve and validate the path to the Webpack config file
	const resolvedConfigPath = path.resolve(process.cwd(), configPath);
	let webpackConfig;
	try {
		webpackConfig = require(resolvedConfigPath);
	} catch (error) {
		console.error("Error: Unable to load the Webpack config file. Please ensure it's a valid JavaScript file.");
		console.error(error);
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

const getVersion = () => {
	const packageJsonPath = path.resolve(__dirname, '../package.json');
	const packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
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
		.requiredOption("-c, --config <path>", "Path to the Webpack configuration file.")
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
