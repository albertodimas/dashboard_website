#!/usr/bin/env node
// Cleans up legacy directories accidentally created by invalid paths on Windows
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

async function main() {
  const cwd = process.cwd()
  const legacy = [
    'D:dashboard_websiteappswebpublicavatars',
    'D:dashboard_websiteappswebpublicgallery',
    'D:dashboard_websiteappswebpublicservices',
    'D:dashboard_websiteappswebpublicbusiness'
  ]
  for (const d of legacy) {
    const abs = path.join(cwd, d)
    if (fs.existsSync(abs)) {
      console.log('Removing legacy directory:', abs)
      await fsp.rm(abs, { recursive: true, force: true })
    }
  }
  console.log('Cleanup complete.')
}

main().catch((e) => {
  console.error('Cleanup failed:', e)
  process.exit(1)
})

