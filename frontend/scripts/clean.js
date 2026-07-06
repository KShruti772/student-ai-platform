const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const targets = ['.next', '.turbo', '.cache', 'node_modules/.cache']

for (const target of targets) {
    const fullPath = path.join(root, target)
    try {
        fs.rmSync(fullPath, { recursive: true, force: true })
        console.log(`Removed ${fullPath}`)
    } catch (error) {
        if (fs.existsSync(fullPath)) {
            console.warn(`Could not remove ${fullPath}: ${error.message}`)
        }
    }
}

process.exit(0)
