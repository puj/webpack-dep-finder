# Contributing to Webpack Dep Finder

Thank you for your interest in contributing to Webpack Dep Finder! We appreciate your support and contributions to make this tool better for everyone.

## Getting Started

### Prerequisites

Ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (version 16.x or higher recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/webpack-dep-finder.git
    cd webpack-dep-finder
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Link the package globally to use the CLI:

    ```bash
    npm link
    ```

### Development Workflow

1. **Make changes** in the `lib/plugin.js` file or other files as needed.
2. **Test your changes**:

    - Use the provided Webpack configuration file `./test/webpack.config.js` and run the CLI tool to test your changes:

        ```bash
        npx webpack-dep-finder --dependency-pattern "c.js$" --config ./test/webpack.config.js
        ```

    - This command will search for files matching `c.js$` and output the dependency path.

3. **Watch mode**: For continuous development, you can enable Webpack’s watch mode in the test project:

    ```bash
    npx webpack --config ./test/webpack.config.js --watch
    ```

### Submitting Changes

1. **Create a branch** for your changes:

    ```bash
    git checkout -b your-feature-branch
    ```

2. **Commit your changes** with a clear message:

    ```bash
    git commit -m "Description of your changes"
    ```

3. **Push to the branch**:

    ```bash
    git push origin your-feature-branch
    ```

4. **Open a Pull Request**: Navigate to the repository on GitHub and create a new pull request.

### Code Guidelines

-   Follow [JavaScript Standard Style](https://standardjs.com/) for coding.
-   Ensure your code is well-documented and follows the project's style.
-   Write clear, concise commit messages.

### Reporting Issues

If you encounter any issues or have suggestions for improvements, please create an issue on GitHub.

---

Thank you for contributing!
