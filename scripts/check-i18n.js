#!/usr/bin/env node
const { glob } = require('glob')
const fs = require('fs')

async function main() {
  const files = await glob('**/*.{ts,tsx,js,jsx}', { ignore: ['**/node_modules/**', '**/.turbo/**', '**/dist/**', '**/.next/**'] })
  const problems = []
  const reTLang = /t\(['\"]language['\"]\)/
  const reLangTernary = /language\s*===\s*['\"]en['\"]/ // heuristic
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8')
    if (reTLang.test(text)) {
      problems.push({ file: f, type: "t('language') usage" })
    }
    if (reLangTernary.test(text)) {
      problems.push({ file: f, type: "language === 'en' conditional" })
    }
  }
  if (problems.length) {
    console.log('i18n check found possible issues:')
    for (const p of problems) console.log(`- ${p.type} -> ${p.file}`)
    process.exitCode = 1
  } else {
    console.log('i18n check passed: no anti-patterns found.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

