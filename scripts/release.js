#!/usr/bin/env node

/**
 * Release script for DigiMaker CLI
 *
 * Usage:
 *   npm run release           # Interactive release
 *   npm run release -- patch  # Bump patch version
 *   npm run release -- minor  # Bump minor version
 *   npm run release -- major  # Bump major version
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function exec(cmd, options = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...options });
}

function execOutput(cmd) {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  return pkg.version;
}

function updateCoreDependency(version) {
  const corePath = 'packages/core/package.json';
  const corePkg = JSON.parse(readFileSync(corePath, 'utf-8'));
  corePkg.dependencies = corePkg.dependencies || {};
  corePkg.dependencies['@digimakers/docling-cleaner'] = `^${version}`;
  writeFileSync(corePath, `${JSON.stringify(corePkg, null, 2)}\n`);
}

function updateDoclingMetaVersion(version) {
  const metaPath = 'packages/docling-cleaner/package.json';
  const metaPkg = JSON.parse(readFileSync(metaPath, 'utf-8'));
  metaPkg.version = version;
  metaPkg.optionalDependencies = metaPkg.optionalDependencies || {};
  metaPkg.optionalDependencies['@digimakers/docling-cleaner-linux-x64'] = version;
  metaPkg.optionalDependencies['@digimakers/docling-cleaner-darwin-arm64'] = version;
  metaPkg.optionalDependencies['@digimakers/docling-cleaner-darwin-x64'] = version;
  metaPkg.optionalDependencies['@digimakers/docling-cleaner-win32-x64'] = version;
  writeFileSync(metaPath, `${JSON.stringify(metaPkg, null, 2)}\n`);
}

function updatePlatformPackageVersions(version) {
  const platforms = [
    'packages/docling-cleaner-linux-x64/package.json',
    'packages/docling-cleaner-darwin-x64/package.json',
    'packages/docling-cleaner-darwin-arm64/package.json',
    'packages/docling-cleaner-win32-x64/package.json',
  ];
  for (const pkgPath of platforms) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    pkg.version = version;
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let bumpType = args[0];

  console.log('');
  console.log('DigiMaker Release Script');
  console.log('========================');
  console.log('');

  // Check for uncommitted changes
  try {
    const status = execOutput('git status --porcelain');
    if (status) {
      console.log('Warning: You have uncommitted changes:');
      console.log(status);
      const proceed = await ask('Continue anyway? (y/N) ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Aborted.');
        process.exit(0);
      }
    }
  } catch (e) {
    console.error('Error checking git status');
    process.exit(1);
  }

  // Get current version
  const currentVersion = getCurrentVersion();
  console.log(`Current version: ${currentVersion}`);
  console.log('');

  // Determine bump type
  if (!bumpType) {
    console.log('Select version bump type:');
    console.log('  1. patch (bug fixes)');
    console.log('  2. minor (new features)');
    console.log('  3. major (breaking changes)');
    console.log('');
    const choice = await ask('Enter choice (1/2/3): ');

    switch (choice) {
      case '1':
        bumpType = 'patch';
        break;
      case '2':
        bumpType = 'minor';
        break;
      case '3':
        bumpType = 'major';
        break;
      default:
        console.log('Invalid choice. Aborted.');
        process.exit(1);
    }
  }

  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error(`Invalid bump type: ${bumpType}`);
    console.error('Must be one of: patch, minor, major');
    process.exit(1);
  }

  console.log('');
  console.log(`Bumping ${bumpType} version...`);
  console.log('');

  // Bump version in all packages
  exec(`npm run version:${bumpType}`);

  // Get new version
  const newVersion = getCurrentVersion();
  console.log('');
  console.log(`New version: ${newVersion}`);
  console.log('');

  console.log('Updating docling package versions...');
  updateCoreDependency(newVersion);
  updateDoclingMetaVersion(newVersion);
  updatePlatformPackageVersions(newVersion);

  // Confirm release
  const confirm = await ask(`Create release v${newVersion}? (y/N) `);
  if (confirm.toLowerCase() !== 'y') {
    console.log('Aborted. Rolling back version changes...');
    exec('git checkout -- .');
    process.exit(0);
  }

  // Build to verify everything works
  console.log('');
  console.log('Building all packages...');
  exec('npm run build');

  // Commit version bump
  console.log('');
  console.log('Committing version bump...');
  exec('git add .');
  exec(`git commit -m "chore: release v${newVersion}"`);

  // Create and push tag
  console.log('');
  console.log('Creating git tag...');
  exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

  console.log('');
  console.log('Pushing to origin...');
  exec('git push');
  exec('git push --tags');

  console.log('');
  console.log('='.repeat(50));
  console.log(`Release v${newVersion} created successfully!`);
  console.log('');
  console.log('GitHub Actions will now:');
  console.log('  1. Build all packages');
  console.log('  2. Publish docling-cleaner platform packages');
  console.log('  3. Publish core + cli to npm');
  console.log('  4. Create GitHub release');
  console.log('');
  console.log('Monitor the release at:');
  console.log(`  https://github.com/jenul-ferdinand/digimaker/actions`);
  console.log('='.repeat(50));

  rl.close();
}

main().catch((err) => {
  console.error('Release failed:', err);
  rl.close();
  process.exit(1);
});
