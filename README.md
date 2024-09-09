![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/puj/webpack-dep-finder/main.yml)
[![NPM Version](https://img.shields.io/npm/v/webpack-dep-finder)](https://www.npmjs.com/package/webpack-dep-finder)
[![NPM Downloads](https://img.shields.io/npm/dm/webpack-dep-finder)](https://www.npmjs.com/package/webpack-dep-finder)
[![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/webpack-dep-finder)](https://www.npmjs.com/package/webpack-dep-finder)

<div align="center">
  <a href="https://github.com/yourusername/webpack-dep-finder">
    <img width="200" height="200"
      src="https://github.com/user-attachments/assets/3ff80c8f-b354-4d0f-a417-5d6a2a96ec78">
  </a>
  <h1>Webpack Dep Finder</h1>
  <p>A fast and efficient tool for pinpointing the issuer path of a specific dependency in your Webpack bundles.</p>
</div>

<div align="center">
  <!-- Place for GIF demo -->
  <img src="path/to/your/demo.gif" alt="Demo" width="600" />
</div>

### Example Output

```bash
Found target dependency: /path/to/your/dependency.js
/path/to/your/entry-file.js
  /path/to/another/dependency.js
    /path/to/your/dependency.js
```

This output shows the path from the entry file to the target dependency.

## Usage

### As a CLI Utility

You can use `webpack-dep-finder` as a CLI tool:

```bash
# Install the package globally
npm install -g webpack-dep-finder

# Run the CLI tool
npx webpack-dep-finder --dependency-pattern /your-regex-pattern/ --config path/to/webpack.config.js
```

#### New Features

-   **Specify an entry point**: You can specify an entry point using the `--entry-point` option or search for an entry point using a partial string or regex match with `--entry-match`.
-   **Override `ts-loader`**: If `ts-loader` is detected, it is automatically overridden to use `transpileOnly: true` to speed up TypeScript builds during dependency scanning.

### CLI Options

```bash
-d, --dependency-pattern <pattern>   Regex pattern to match the resource path/filename to locate. (Required)
--no-halt-on-match                   Continue searching even after the dependency is found. (Default: false)
--show-webpack-output                Display Webpack's build output. (Default: false)
-c, --config <path>                  Path to the Webpack configuration file. (Default: "webpack.config.js")
--entry-point <path>                 Specify an entry point to begin the search from.
--entry-match <pattern>              Specify a regex or partial string to match the entry point filename.
-V, --version                        Output the version number.
-h, --help                           Output usage information.
```

### As a Webpack Plugin

```bash
# NPM
npm install --save-dev webpack-dep-finder
# Yarn
yarn add -D webpack-dep-finder
```

```js
const WebpackDepFinder = require("webpack-dep-finder");

new WebpackDepFinder({
    dependencyPattern: /your-regex-pattern/,
    haltOnMatch: true,
    showWebpackOutput: false
});
```

### Performance Insights

**Speed Benefits:**

-   **Up to 100x Faster**: Unlike tools that analyze the entire Webpack build, `webpack-dep-finder` identifies dependencies quickly by stopping the search as soon as the specified dependency is found.
-   **Conditional Timing**: If the dependency is not found, the tool will run for the entire build duration. The effectiveness can vary based on your project’s size and structure.

**Visualizing Speedup**:

<div align="center">
  <!-- Place for speedup graph -->
  <img src="path/to/your/speedup-graph.png" alt="Speedup Graph" width="600" />
</div>

## Major Use Cases

-   **Optimizing Script Evaluation Time**: Speed up the process of finding and analyzing dependencies, crucial for large React web applications.
-   **Reducing Bundle Chunk Size**: Efficiently locate and manage dependencies to optimize bundle sizes and overall performance.

## Troubleshooting

### Why is `webpack-dep-finder` so fast?

`webpack-dep-finder` is designed for speed by stopping the search as soon as the specified dependency is found during the Webpack compilation process. This approach contrasts with tools that analyze the entire bundle, making `webpack-dep-finder` a quicker option for targeted searches.

### What happens if the dependency is not found?

If the specified dependency isn't found, `webpack-dep-finder` will complete the entire build process without performing any additional analysis. Ensure that the dependency name is correct and that it is included in your Webpack build.

## Other Tools

-   [Statoscope](https://github.com/statoscope/statoscope) - A more comprehensive Webpack bundle analysis tool with additional features like interactive treemaps.

## Maintainers

<table>
  <tbody>
    <tr>
      <td align="center">
        <img width="150" height="150"
        src="https://avatars.githubusercontent.com/u/807352?v=4&size=64">
        </br>
        <a href="https://github.com/pu">puj</a>
      </td>
    </tr>
  <tbody>
</table>

## Support the developer!

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/puj_codes)

## Contributing

We welcome contributions to Webpack Dep Finder! Please see [CONTRIBUTING.md](https://github.com/puj/webpack-dep-finder/blob/master/CONTRIBUTING.md) for more details.
