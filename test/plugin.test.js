const WebpackDepFinder = require("../lib/plugin");

describe("WebpackDepFinder", () => {
    let loggerMock;
    let originalProcessExit;
    let originalClearLine;

    beforeEach(() => {
        loggerMock = {
            log: jest.fn()
        };
        // Mock process.exit
        originalProcessExit = process.exit;
        originalClearLine = process.stdout.clearLine;
        process.exit = jest.fn();
        process.stdout.clearLine = jest.fn();
    });

    afterEach(() => {
        // Restore process.exit after each test
        process.exit = originalProcessExit;
        process.stdout.clearLine = originalClearLine;
    });

    it("should initialize correctly", () => {
        const instance = new WebpackDepFinder({ dependencyPattern: /test/ });
        expect(instance.dependencyPattern).toEqual(/test/);
        expect(instance.haltOnMatch).toBe(true);
        expect(instance.showWebpackOutput).toBe(false);
    });

    it("should start and stop the timer", done => {
        const instance = new WebpackDepFinder({ dependencyPattern: /test/ });
        instance.startTimer();
        // Introduce a small delay to allow measurable time to elapse
        setTimeout(() => {
            const elapsed = instance.stopTimer();
            expect(parseFloat(elapsed)).toBeGreaterThan(0);
            done(); // Call done() to indicate that the test is complete
        }, 10); // 10 ms delay
    });

    it("should show progress", () => {
        const instance = new WebpackDepFinder({ dependencyPattern: /test/, logger: loggerMock });
        instance.startTimer();
        instance.resourceCount = 5;
        instance.lastResource = "test-resource.js";
        instance.showProgress();

        if (process.stdout.isTTY) {
            expect(loggerMock.log).toHaveBeenCalledTimes(3);
            expect(loggerMock.log).toHaveBeenCalledWith(
                "Elapsed Time: 0.00s | Resources Scanned: 5 | Processing: test-resource.js"
            );
        } else {
            expect(loggerMock.log).toHaveBeenCalledTimes(0);
        }
    });

    it("should analyze a module and find a target dependency", () => {
        const instance = new WebpackDepFinder({ dependencyPattern: /target/, logger: loggerMock });
        const mockModule = {
            resource: "target-resource.js"
        };
        const mockCompilation = {
            moduleGraph: {
                getIssuer: jest.fn().mockReturnValue(null)
            }
        };

        instance.analyzeModule(mockModule, mockCompilation);

        expect(loggerMock.log).toHaveBeenCalledWith("\n\nFound target dependency: target-resource.js");
        expect(process.exit).toHaveBeenCalledWith(0); // Check that process.exit was called with 0
    });

    it("should print inclusion chain correctly", () => {
        const instance = new WebpackDepFinder({
            dependencyPattern: /test/,
            logger: loggerMock,
            showWebpackOutput: true
        });
        const chain = ["module1.js", "module2.js", "module3.js"];
        instance.printInclusionChain(chain);

        expect(loggerMock.log).toHaveBeenCalledTimes(8);
        expect(loggerMock.log).toHaveBeenCalledWith("\n");
        expect(loggerMock.log).toHaveBeenCalledWith("\n");
        expect(loggerMock.log).toHaveBeenCalledWith("Target pattern   : '/test/'\n");
        expect(loggerMock.log).toHaveBeenCalledWith("Matching module  : module3.js\n");
        expect(loggerMock.log).toHaveBeenCalledWith("Inclusion chain (3 modules):\n");
        expect(loggerMock.log).toHaveBeenCalledWith("module1.js\n");
        expect(loggerMock.log).toHaveBeenCalledWith("  module2.js\n");
        expect(loggerMock.log).toHaveBeenCalledWith("    module3.js\n");
    });
});
