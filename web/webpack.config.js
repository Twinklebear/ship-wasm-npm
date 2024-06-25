const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    headers: [
      {
        key: "Cross-Origin-Embedder-Policy",
        value: "require-corp",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      },
    ],
  },
  output: {
    filename: "[contenthash].js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "./node_modules/@twinklebear/wasm_demo_package/dist/*.wasm",
          to() {
            return "[name][ext]";
          },
        },
        // TODO: seems this is needed to pull in the worker JS file properly
        {
          from: "./node_modules/@twinklebear/wasm_demo_package/dist/*.js",
          to() {
            return "[name][ext]";
          },
        },
      ],
    }),
  ],
};
