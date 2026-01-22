const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { execFileSync } = require('child_process');

const PLATFORM_TAGS = {
  'linux-x64': 'linux-x64',
  'darwin-x64': 'darwin-x64',
  'darwin-arm64': 'darwin-arm64',
  'win32-x64': 'win32-x64',
};

const ASSET_NAMES = {
  'linux-x64': 'docling-cleaner-linux-x64.tar.gz',
  'darwin-x64': 'docling-cleaner-darwin-x64',
  'darwin-arm64': 'docling-cleaner-darwin-arm64',
  'win32-x64': 'docling-cleaner-win32-x64.exe',
};

function getPackageVersion() {
  const pkgPath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

function getPlatformTag() {
  const tag = `${process.platform}-${process.arch}`;
  return PLATFORM_TAGS[tag] || null;
}

function getCacheDir(version) {
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || path.json(os.homedir(), 'AppData', 'Local');
    return path.join(base, 'digimaker', 'docling-cleaner', version);
  }

  return path.join(os.homedir(), '.cache', 'digimaker', 'docling-cleaner', version);
}

function ensureDirSync(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function extractTarball(tarPath, destination) {
  ensureDirSync(destination);
  const stdio =
    process.env.DEBUG_DOCLING_CLEANER === '1' || process.env.CI === 'true' ? 'inherit' : 'ignore';
  execFileSync('tar', ['-xzf', tarPath, '-C', destination], { stdio });
}

function debugLog(message) {
  if (process.env.DEBUG_DOCLING_CLEANER === '1') {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}

function downloadFile(url, destination, redirects = 0) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    const request = https.get(url, (response) => {
      const status = response.statusCode || 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        if (redirects >= 5) {
          response.resume();
          reject(new Error('Too many redirects'));
          return;
        }
        const nextUrl = new URL(response.headers.location, url).toString();
        response.resume();
        file.close(() => {
          fs.unlink(destination, () => {
            downloadFile(nextUrl, destination, redirects + 1).then(resolve, reject);
          });
        });
        return;
      }

      if (status !== 200) {
        response.resume();
        file.close(() => {
          fs.unlink(destination, () => {
            reject(new Error(`Unexpected status code ${status}`));
          });
        });
        return;
      }

      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    });

    request.on('error', (error) => {
      fs.unlink(destination, () => {
        reject(error);
      });
    });

    file.on('error', (error) => {
      fs.unlink(destination, () => {
        reject(error);
      });
    });
  });
}

async function ensureDoclingCleaner() {
  const overridePath = process.env.DOCLING_CLEANER_PATH;
  if (overridePath && fs.existsSync(overridePath)) {
    return overridePath;
  }

  const platformTag = getPlatformTag();
  if (!platformTag) {
    throw new Error(
      `Unsupported platform for docling-cleaner: ${process.platform}-${process.arch}`
    );
  }

  const version = getPackageVersion();
  const assetName = ASSET_NAMES[platformTag];
  const cacheDir = path.join(getCacheDir(version), platformTag);
  const cachedBinaryPath = path.join(cacheDir, assetName);
  const linuxExtractedBinary = path.join(cacheDir, 'docling-cleaner', 'docling-cleaner');

  if (platformTag === 'linux-x64' && fs.existsSync(linuxExtractedBinary)) {
    fs.chmodSync(linuxExtractedBinary, 0o755);
    return linuxExtractedBinary;
  }

  if (platformTag !== 'linux-x64' && fs.existsSync(cachedBinaryPath)) {
    if (process.platform !== 'win32') {
      fs.chmodSync(cachedBinaryPath, 0o755);
    }
    return cachedBinaryPath;
  }

  ensureDirSync(cacheDir);

  const baseUrl =
    process.env.DOCLING_CLEANER_BASE_URL ||
    `https://github.com/jenul-ferdinand/digimaker/releases/download/v${version}/`;
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const downloadUrl = `${normalizedBaseUrl}${assetName}`;
  const tempPath = `${cachedBinaryPath}.download`;

  try {
    debugLog(`docling-cleaner download: ${downloadUrl}`);
    debugLog(`docling-cleaner cache dir: ${cacheDir}`);
    await downloadFile(downloadUrl, tempPath);
    if (platformTag === 'linux-x64') {
      extractTarball(tempPath, cacheDir);
      fs.unlinkSync(tempPath);
      if (fs.existsSync(linuxExtractedBinary)) {
        debugLog(`docling-cleaner extracted: ${linuxExtractedBinary}`);
        fs.chmodSync(linuxExtractedBinary, 0o755);
        return linuxExtractedBinary;
      }
      throw new Error('Extracted Linux binary not found after tar extraction');
    }

    fs.renameSync(tempPath, cachedBinaryPath);
    if (process.platform !== 'win32') {
      fs.chmodSync(cachedBinaryPath, 0o755);
    }
    return cachedBinaryPath;
  } catch (error) {
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors.
    }
    const message = error && error.message ? error.message : String(error);
    throw new Error(`Failed to download docling-cleaner from ${downloadUrl}: ${message}`);
  }
}

module.exports = { ensureDoclingCleaner };
