const path = require("path");

module.exports = {
  output: 'standalone',
  experimental: {
    reactCompiler: true,
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
}
