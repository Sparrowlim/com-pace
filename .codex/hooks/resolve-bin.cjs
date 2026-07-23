const path = require('node:path')

function resolveBin(pkgName, binName = pkgName) {
  const pkgJsonPath = require.resolve(`${pkgName}/package.json`)
  const pkg = require(pkgJsonPath)
  const binField = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[binName]
  return path.join(path.dirname(pkgJsonPath), binField)
}

module.exports = { resolveBin }
