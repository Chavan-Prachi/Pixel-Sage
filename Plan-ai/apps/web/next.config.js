const path = require('node:path')

module.exports = {
  output: 'standalone',
  experimental: {
    reactCompiler: true,
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
}
