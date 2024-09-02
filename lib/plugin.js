const { performance } = require("perf_hooks");

class WebpackDepFinder {
    constructor({ dependencyPattern, bail = true, logger = console }) {
        if (!(dependencyPattern instanceof RegExp)) {
            throw new Error("`dependencyPattern` must be a valid RegExp.");
        }
        this.dependencyPattern = dependencyPattern;
        this.bail = bail;
        this.logger = logger;
        this.startTime = 0;
        this.resourceCount = 0;
        this.lastResource = null;
        this.intervalId = null;
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
        const webpackVersion = compiler.webpack ? parseInt(compiler.webpack.version.split(".")[0]) : 4;

        compiler.hooks.beforeRun.tap("WebpackDepFinder", () => {
            this.startTimer();
            this.logger.log("Starting dependency scan...");
            this.startProgressInterval();
        });

        const handleModule = (module, compilation) => {
            this.resourceCount++;
            this.lastResource = module.resource;
            this.showProgress();
            this.analyzeModule(module, compilation);
        };

        const tapHook = compilation => {
            compilation.hooks.buildModule.tap("WebpackDepFinder", module => {
                handleModule(module, compilation);
            });
        };

        compiler.hooks.compilation.tap("WebpackDepFinder", tapHook);

        compiler.hooks.done.tap("WebpackDepFinder", () => {
            this.stopProgressInterval();
            const totalTime = this.stopTimer();
            this.logger.log(`\n\nDependency scan completed in ${totalTime} seconds.`);
            this.logger.log(`Total resources scanned: ${this.resourceCount}`);
            this.logger.log(`Processed: ${this.lastResource || "N/A"}`);
        });
    }

    showProgress() {
        if (process.stdout.isTTY) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            const elapsedSeconds = ((performance.now() - this.startTime) / 1000).toFixed(2);
            process.stdout.write(
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
            if (this.bail) {
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
        chain.forEach((resource, index) => {
            this.logger.log(`${" ".repeat(index * 2)}${resource}`);
        });
    }
}

module.exports = WebpackDepFinder;
