#!/usr/bin/env node
const { ensureDoclingCleaner } = require('./index.js');

async function main() {
  // Skip in CI environments where binaries are handled separately
  if (process.env.CI === 'true') {
    console.log('@digimakers/docling-cleaner: Skipping postinstall in CI');
    return;
  }

  // Skip if user explicitly opts out
  if (process.env.DOCLING_SKIP_POSTINSTALL === '1') {
    console.log('@digimakers/docling-cleaner: Skipping postinstall (DOCLING_SKIP_POSTINSTALL=1)');
    return;
  }

  try {
    console.log('@digimakers/docling-cleaner: Downloading platform binary...');
    const binaryPath = await ensureDoclingCleaner();
    console.log(`@digimakers/docling-cleaner: Binary ready at ${binaryPath}`);
  } catch (error) {
    // Don't fail install - uv fallback can be used at runtime
    console.warn('@digimakers/docling-cleaner: Binary download failed, uv fallback will be used');
    console.warn(`  Reason: ${error.message}`);
  }
}

main();
