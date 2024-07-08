const puppeteer = require('puppeteer');
const { exec } = require('child_process');

(async () => {
  const browserFetcher = puppeteer.createBrowserFetcher();
  const revision = process.env.PUPPETEER_CHROMIUM_REVISION || '1022525';
  console.log(`Downloading Chromium revision ${revision}...`);

  const revisionInfo = await browserFetcher.download(revision);
  console.log(`Chromium revision ${revision} downloaded to ${revisionInfo.folderPath}`);

  exec(`ln -sf ${revisionInfo.executablePath} /usr/bin/chromium-browser`, (err) => {
    if (err) {
      console.error('Error linking Chromium binary:', err);
      process.exit(1);
    } else {
      console.log('Chromium binary linked successfully');
      process.exit(0);
    }
  });
})();
