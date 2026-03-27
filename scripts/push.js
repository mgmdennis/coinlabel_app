#!/usr/bin/env node
// Usage: npm run push
// Bumps patch version, updates frontend/src/version.js, commits, tags, and pushes.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Bump version in package.json (creates a git commit + tag)
execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });

// 2. Write updated version into frontend/src/version.js
const version = require('../package.json').version;
const versionFile = path.join(__dirname, '..', 'frontend', 'src', 'version.js');
fs.writeFileSync(versionFile, `const version = '${version}';\nexport default version;\n`);
console.log(`✅ version.js updated to ${version}`);

// 3. Stage both files and make a single commit
execSync('git add package.json frontend/src/version.js', { stdio: 'inherit' });
execSync(`git commit -m "v${version}"`, { stdio: 'inherit' });

// 4. Tag and push
execSync(`git tag v${version}`, { stdio: 'inherit' });
execSync('git push --follow-tags', { stdio: 'inherit' });

console.log(`🚀 Pushed v${version}`);
