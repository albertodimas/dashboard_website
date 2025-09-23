#!/usr/bin/env node
// Smoke check for image storage paths
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

async function main() {
  const cwd = process.cwd()
  const appPublic = path.join(cwd, 'apps', 'web', 'public')
  const rootPublic = path.join(cwd, 'public')
  const basePublic = fs.existsSync(appPublic) ? appPublic : (fs.existsSync(rootPublic) ? rootPublic : appPublic)
  console.log('Base public:', basePublic)

  const folders = ['avatars', 'gallery', 'service', 'business']
  for (const f of folders) {
    const dir = path.join(basePublic, f)
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true })
      console.log('Created folder:', dir)
    } else {
      console.log('Exists:', dir)
    }
  }

  const legacy = [
    'D:nexodashappswebpublicavatars',
    'D:nexodashappswebpublicgallery',
    'D:nexodashappswebpublicservices',
    'D:nexodashappswebpublicbusiness'
  ]
  for (const d of legacy) {
    const abs = path.join(cwd, d)
    console.log('Legacy present?', abs, fs.existsSync(abs) ? 'YES' : 'no')
  }
}

main().catch((e) => {
  console.error('Smoke check failed:', e)
  process.exit(1)
})

