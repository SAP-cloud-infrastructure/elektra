const fs = require("fs")
const path = require("path")

const sourceDir = path.join(__dirname, "node_modules/monaco-editor/min/vs")
const targetDir = path.join(__dirname, "public/assets/monaco/vs")

// Create target directory
fs.mkdirSync(targetDir, { recursive: true })

// Copy the vs directory
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory()

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true })
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName))
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

copyRecursiveSync(sourceDir, targetDir)
console.log("✓ Monaco Editor assets copied to public/monaco/vs")
