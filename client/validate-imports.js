#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const srcDir = path.join(__dirname, 'src')
const nodeModulesDir = path.join(__dirname, 'node_modules')
const publicDir = path.join(__dirname, 'public')

// Tracking
const errors = []
const warnings = []
const scannedFiles = []
const aliasMap = {
    '@': path.join(__dirname, 'src'),
}

// Extension variations to check
const extensions = ['.jsx', '.js', '.tsx', '.ts', '.json', '']

/**
 * Resolve an import path to an actual file
 * @param {string} importPath - The path from the import statement
 * @param {string} fromFile - The file containing the import
 * @returns {boolean} - Whether the import resolves successfully
 */
function resolveImportPath(importPath, fromFile) {
    // External packages (node_modules)
    if (
        !importPath.startsWith('.') &&
        !importPath.startsWith('/') &&
        !importPath.startsWith('@/')
    ) {
        const packageName = importPath.split('/')[0]
        const packagePath = path.join(nodeModulesDir, packageName)
        return fs.existsSync(packagePath)
    }

    // Absolute alias imports (@/...)
    if (importPath.startsWith('@/')) {
        const aliasPath = importPath.replace('@/', '')
        const resolvedPath = path.join(aliasMap['@'], aliasPath)
        return checkFileExists(resolvedPath)
    }

    // Relative imports (../ or ./)
    if (importPath.startsWith('.')) {
        const dir = path.dirname(fromFile)
        const resolvedPath = path.resolve(dir, importPath)
        return checkFileExists(resolvedPath)
    }

    return false
}

/**
 * Check if a file exists with any valid extension
 * @param {string} filePath - The path to check
 * @returns {boolean}
 */
function checkFileExists(filePath) {
    // Direct file exists
    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath)
        return stat.isFile()
    }

    // Check with various extensions
    for (const ext of extensions) {
        const fileWithExt = filePath + ext
        if (fs.existsSync(fileWithExt)) {
            try {
                const stat = fs.statSync(fileWithExt)
                if (stat.isFile()) {
                    return true
                }
            } catch {
                continue
            }
        }
    }

    // Check if it's a directory with index file
    try {
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath)
            if (stat.isDirectory()) {
                const indexFiles = ['index.jsx', 'index.js', 'index.tsx', 'index.ts']
                for (const indexFile of indexFiles) {
                    const indexPath = path.join(filePath, indexFile)
                    if (fs.existsSync(indexPath)) {
                        return true
                    }
                }
            }
        }
    } catch {
        return false
    }

    return false
}

/**
 * Extract all import statements from a file
 * @param {string} content - File content
 * @returns {Array} - Array of {importPath, line}
 */
function extractImports(content) {
    const imports = []

    // Remove code blocks (```...```) to avoid parsing documentation examples
    let contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '')

    const importRegex = /import\s+(?:{[^}]*}|[^from]*)\s+from\s+['"]([^'"]+)['"]/g
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g

    let match

    // Extract ES6 imports
    while ((match = importRegex.exec(contentWithoutCodeBlocks)) !== null) {
        const importPath = match[1]
        // Calculate line number
        const charUpToImport = contentWithoutCodeBlocks.substring(0, match.index)
        const lineNumber = charUpToImport.split('\n').length
        imports.push({ importPath, line: lineNumber })
    }

    // Extract CommonJS requires
    while ((match = requireRegex.exec(contentWithoutCodeBlocks)) !== null) {
        const importPath = match[1]
        const charUpToRequire = contentWithoutCodeBlocks.substring(0, match.index)
        const lineNumber = charUpToRequire.split('\n').length
        imports.push({ importPath, line: lineNumber })
    }

    return imports
}

/**
 * Scan a single file for import errors
 * @param {string} filePath - Full path to the file
 */
function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8')
        const imports = extractImports(content)
        scannedFiles.push(filePath)

        imports.forEach(({ importPath, line }) => {
            // Skip type definitions and internal imports
            if (importPath.includes('types/') || importPath.includes('@types/')) {
                return
            }

            if (!resolveImportPath(importPath, filePath)) {
                // Check if it's a common case-sensitivity issue
                const suggestion = checkCaseSensitivity(importPath, filePath)

                const errorMsg = `[${path.relative(
                    srcDir,
                    filePath
                )}:${line}] Cannot resolve: "${importPath}"`
                errors.push({
                    file: filePath,
                    line,
                    importPath,
                    message: errorMsg,
                    suggestion,
                })
            }
        })
    } catch (err) {
        warnings.push(`Failed to scan ${path.relative(srcDir, filePath)}: ${err.message}`)
    }
}

/**
 * Check for case sensitivity issues
 * @param {string} importPath - The import path
 * @param {string} fromFile - The file containing the import
 * @returns {string|null} - Suggested correct path
 */
function checkCaseSensitivity(importPath, fromFile) {
    if (importPath.startsWith('@/')) {
        const aliasPath = importPath.replace('@/', '')
        const resolvedPath = path.join(aliasMap['@'], aliasPath)
        const dir = path.dirname(resolvedPath)

        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir)
            const lowerImport = path.basename(aliasPath).toLowerCase()

            for (const file of files) {
                if (file.toLowerCase() === lowerImport) {
                    const correctedPath = aliasPath.replace(path.basename(aliasPath), file)
                    return `@/${correctedPath}`
                }
            }
        }
    }

    if (importPath.startsWith('.')) {
        const dir = path.dirname(fromFile)
        const resolvedPath = path.resolve(dir, importPath)
        const parentDir = path.dirname(resolvedPath)

        if (fs.existsSync(parentDir)) {
            const files = fs.readdirSync(parentDir)
            const lowerImport = path.basename(resolvedPath).toLowerCase()

            for (const file of files) {
                if (file.toLowerCase() === lowerImport) {
                    return importPath.replace(path.basename(importPath), file)
                }
            }
        }
    }

    return null
}

/**
 * Recursively scan directory for .jsx, .js, .tsx, .ts files
 * @param {string} dir - Directory to scan
 */
function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
        return
    }

    const files = fs.readdirSync(dir)

    files.forEach((file) => {
        const fullPath = path.join(dir, file)

        // Skip node_modules and other irrelevant directories
        if (file.startsWith('.') || file === 'node_modules' || file === '__pycache__') {
            return
        }

        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            scanDirectory(fullPath)
        } else if (/\.(jsx?|tsx?)$/.test(file)) {
            scanFile(fullPath)
        }
    })
}

/**
 * Print results
 */
function printResults() {
    console.log('\n' + '='.repeat(80))
    console.log('IMPORT VALIDATION REPORT')
    console.log('='.repeat(80) + '\n')

    console.log(`📁 Files Scanned: ${scannedFiles.length}`)
    console.log(`❌ Errors Found: ${errors.length}`)
    console.log(`⚠️  Warnings: ${warnings.length}\n`)

    if (errors.length > 0) {
        console.log('IMPORT ERRORS:')
        console.log('-'.repeat(80))
        errors.forEach(({ message, suggestion }) => {
            console.log(`\n${message}`)
            if (suggestion) {
                console.log(`   💡 Suggestion: "${suggestion}"`)
            }
        })
        console.log('\n' + '-'.repeat(80))
    }

    if (warnings.length > 0) {
        console.log('\nWARNINGS:')
        console.log('-'.repeat(80))
        warnings.forEach((warning) => {
            console.log(`⚠️  ${warning}`)
        })
        console.log('-'.repeat(80))
    }

    if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ All imports are valid!')
    }

    console.log('\n' + '='.repeat(80) + '\n')

    return errors.length === 0
}

/**
 * Scan for relative imports that could use alias
 */
function scanForAliasOpportunities() {
    const opportunities = []

    scannedFiles.forEach((filePath) => {
        try {
            const content = fs.readFileSync(filePath, 'utf8')
            const lines = content.split('\n')

            lines.forEach((line, index) => {
                // Check for relative imports that should use alias
                const match = line.match(
                    /from\s+['"](\.\.\/(?:components|lib|utils|hooks|context|data|assets|pages)\/[^'"]+)['"]/
                )
                if (match) {
                    opportunities.push({
                        file: path.relative(srcDir, filePath),
                        line: index + 1,
                        current: match[1],
                        suggested: match[1].replace(/^\.\.\//, '@/'),
                    })
                }
            })
        } catch (err) {
            // Skip files we can't read
        }
    })

    if (opportunities.length > 0) {
        console.log('\n⚠️  IMPROVEMENT OPPORTUNITIES:')
        console.log('The following imports use relative paths but could use the @/ alias:')
        console.log('-'.repeat(80))
        opportunities.forEach(({ file, line, current, suggested }) => {
            console.log(`\n[${file}:${line}]`)
            console.log(`  Current:   from "${current}"`)
            console.log(`  Suggested: from "${suggested}"`)
        })
        console.log('\n' + '-'.repeat(80))
    }
}

// Main execution
console.log('🔍 Starting import validation...\n')

if (!fs.existsSync(srcDir)) {
    console.error(`❌ Source directory not found: ${srcDir}`)
    process.exit(1)
}

scanDirectory(srcDir)
const success = printResults()
scanForAliasOpportunities()

process.exit(success ? 0 : 1)
