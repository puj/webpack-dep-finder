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
        expect(instance.bail).toBe(true);
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

        expect(loggerMock.log).not.toHaveBeenCalled();
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
        const instance = new WebpackDepFinder({ dependencyPattern: /test/, logger: loggerMock });
        const chain = ["module1.js", "module2.js", "module3.js"];
        instance.printInclusionChain(chain);

        expect(loggerMock.log).toHaveBeenCalledTimes(3);
        expect(loggerMock.log).toHaveBeenCalledWith("module1.js");
        expect(loggerMock.log).toHaveBeenCalledWith("  module2.js");
        expect(loggerMock.log).toHaveBeenCalledWith("    module3.js");
    });
});
