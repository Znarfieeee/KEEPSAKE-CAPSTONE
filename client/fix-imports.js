#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcDir = path.join(__dirname, 'src')

// Patterns to fix - relative imports that should use @/ alias
const patterns = [
    /from\s+['"](\.\.\/(?:components|lib|utils|hooks|context|data|assets|pages)\/[^'"]+)['"]/g,
]

let filesModified = 0
let importsFixed = 0

function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8')
        const originalContent = content

        patterns.forEach((pattern) => {
            let match
            while ((match = pattern.exec(content)) !== null) {
                const oldImport = match[1]
                const newImport = oldImport.replace(/^\.\.\//, '@/')
                const oldLine = match[0]
                const newLine = oldLine.replace(oldImport, newImport)

                content = content.replace(oldLine, newLine)
                importsFixed++
            }
            // Reset regex lastIndex
            pattern.lastIndex = 0
        })

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8')
            filesModified++
            console.log(`✅ Fixed: ${path.relative(srcDir, filePath)}`)
        }
    } catch (err) {
        console.error(`❌ Error processing ${filePath}: ${err.message}`)
    }
}

function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return

    const files = fs.readdirSync(dir)

    files.forEach((file) => {
        const fullPath = path.join(dir, file)

        if (file.startsWith('.') || file === 'node_modules' || file === '__pycache__') {
            return
        }

        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            scanDirectory(fullPath)
        } else if (/\.(jsx?|tsx?)$/.test(file)) {
            fixFile(fullPath)
        }
    })
}

// Main execution
console.log('🔧 Starting import path fixes...\n')

if (!fs.existsSync(srcDir)) {
    console.error(`❌ Source directory not found: ${srcDir}`)
    process.exit(1)
}

scanDirectory(srcDir)

console.log('\n' + '='.repeat(80))
console.log(`✅ IMPORT FIXES COMPLETE`)
console.log('='.repeat(80))
console.log(`📝 Files Modified: ${filesModified}`)
console.log(`🔄 Imports Fixed: ${importsFixed}`)
console.log('='.repeat(80) + '\n')

process.exit(0)
