const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");

class WebpackDepFinder {
    constructor({ dependencyPattern, haltOnMatch = true, logger = console, showWebpackOutput = false }) {
        this.dependencyPattern = dependencyPattern;
        this.haltOnMatch = haltOnMatch;
        this.logger = logger;
        this.showWebpackOutput = showWebpackOutput;
        this.startTime = 0;
        this.resourceCount = 0;
        this.lastResource = null;
        this.intervalId = null;

        // Save original streams
        this.originalStdoutWrite = process.stdout.write.bind(process.stdout);
        this.originalStderrWrite = process.stderr.write.bind(process.stderr);

        if (!this.showWebpackOutput) {
            this.redirectWebpackOutput();
        }
    }

    // Centralized output function
    outputToConsole(message) {
        // Make sure to write to the original stdout
        this.originalStdoutWrite(message);

        // Also write to log
        this.logger.log(message);
    }

    startTimer() {
        this.startTime = performance.now();
    }

    stopTimer() {
        return ((performance.now() - this.startTime) / 1000).toFixed(2);
    }

    startProgressInterval() {
        this.intervalId = setInterval(() => {
            this.showProgress();
        }, 1000);
    }

    stopProgressInterval() {
        clearInterval(this.intervalId);
    }

    apply(compiler) {
        compiler.hooks.beforeRun.tap("WebpackDepFinder", () => {
            this.startTimer();
            this.outputToConsole("Starting dependency scan...\n");
            this.startProgressInterval();
        });

        const handleModule = (module, compilation) => {
            this.resourceCount++;
            this.lastResource = module.resource;
            this.showProgress();
            this.analyzeModule(module, compilation);
        };

        compiler.hooks.compilation.tap("WebpackDepFinder", compilation => {
            compilation.hooks.buildModule.tap("WebpackDepFinder", module => {
                handleModule(module, compilation);
            });
        });

        compiler.hooks.done.tap("WebpackDepFinder", () => {
            this.stopProgressInterval();
            const totalTime = this.stopTimer();
            this.outputToConsole(`\n\nDependency scan completed in ${totalTime} seconds.\n`);
            this.outputToConsole(`Total resources scanned: ${this.resourceCount}\n`);
            this.outputToConsole(`Processed: ${this.lastResource || "N/A"}\n`);
        });
    }

    showProgress() {
        if (process.stdout.isTTY) {
            this.outputToConsole("\x1b[2K"); // Clear the entire line
            this.outputToConsole("\x1b[0G"); // Move cursor to the beginning of the line

            const elapsedSeconds = ((performance.now() - this.startTime) / 1000).toFixed(2);
            this.outputToConsole(
                `Elapsed Time: ${elapsedSeconds}s | Resources Scanned: ${this.resourceCount} | Processing: ${
                    this.lastResource || "N/A"
                }`
            );
        }
    }

    analyzeModule(module, compilation) {
        if (this.containsTargetDependency(module)) {
            this.logger.log(`\n\nFound target dependency: ${module.resource}`);
            const inclusionChain = this.collectInclusionChain(module, compilation);
            this.printInclusionChain(inclusionChain);
            if (this.haltOnMatch) {
                process.exit(0);
            }
        }
    }

    containsTargetDependency(module) {
        return module.resource && this.dependencyPattern.test(module.resource);
    }

    collectInclusionChain(module, compilation) {
        const chain = [];
        let currentModule = module;

        while (currentModule) {
            chain.push(currentModule.resource);
            if (compilation.moduleGraph) {
                currentModule = compilation.moduleGraph.getIssuer(currentModule);
            } else {
                currentModule = currentModule.issuer;
            }
        }

        return chain.reverse();
    }

    printInclusionChain(chain) {
        // Summary of the chain
        this.outputToConsole(`\n`);
        this.outputToConsole(`\n`);
        this.outputToConsole(`Target pattern   : '${this.dependencyPattern}'\n`);
        this.outputToConsole(`Matching module  : ${chain[chain.length - 1]}\n`);
        this.outputToConsole(`Inclusion chain (${chain.length} modules):\n`);

        chain.forEach((resource, index) => {
            this.outputToConsole(`${" ".repeat(index * 2)}${resource}\n`);
        });
    }

    redirectWebpackOutput() {
        const logFile = path.join(__dirname, "webpack-log.txt");
        const logStream = fs.createWriteStream(logFile, { flags: "a" });

        // Override process.stdout and process.stderr
        process.stdout.write = (chunk, encoding, callback) => {
            if (!chunk.toString().includes("WebpackDepFinder")) {
                logStream.write(chunk, encoding, callback);
            } else {
                this.originalStdoutWrite(chunk, encoding, callback);
            }
        };

        process.stderr.write = (chunk, encoding, callback) => {
            if (!chunk.toString().includes("WebpackDepFinder")) {
                logStream.write(chunk, encoding, callback);
            } else {
                this.originalStderrWrite(chunk, encoding, callback);
            }
        };

        process.on("exit", () => {
            process.stdout.write = this.originalStdoutWrite;
            process.stderr.write = this.originalStderrWrite;
            logStream.end();
        });
    }
}

module.exports = WebpackDepFinder;
