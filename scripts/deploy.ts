// scripts/deploy.ts
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

// Get the report directory from an environment variable
const PLAYWRIGHT_REPORT_DIR = process.env.PLAYWRIGHT_REPORT_DIR || '';

if (!PLAYWRIGHT_REPORT_DIR) {
    console.error("ERROR: PLAYWRIGHT_REPORT_DIR environment variable not set.");
    process.exit(1);
}

const reportsDir = path.join(__dirname, '../reports');

async function deploy() {
  try {
    // 1. Clean the 'reports' directory
    if (fs.existsSync(reportsDir)) {
      fs.rmSync(reportsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(reportsDir, { recursive: true });

    // 2. Copy Playwright report files
    const sourceReportDir = path.resolve(__dirname, PLAYWRIGHT_REPORT_DIR);
    if (!fs.existsSync(sourceReportDir)) {
      console.error(`ERROR: Playwright report directory not found: ${sourceReportDir}`);
      process.exit(1);
    }

	// Use 'cp' command for recursive copy (more reliable across platforms)
    // -r: recursive, -f: force (overwrite), -a: archive (preserves attributes)
    child_process.execSync(`cp -rfa "${sourceReportDir}/." "${reportsDir}"`);
    console.log(`Playwright reports copied to: ${reportsDir}`);

    // 3. Deploy using gh-pages
    child_process.execSync('npx gh-pages -d reports -b gh-pages', { stdio: 'inherit' });
    console.log('Reports deployed to GitHub Pages!');

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy();