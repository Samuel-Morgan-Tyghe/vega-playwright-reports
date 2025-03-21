// scripts/deploy.ts
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

async function deploy() {
    try {
        // 1. Get the report directory from the environment variable.
        const PLAYWRIGHT_REPORT_DIR = process.env.PLAYWRIGHT_REPORT_DIR;
        if (!PLAYWRIGHT_REPORT_DIR) {
            console.error("ERROR: PLAYWRIGHT_REPORT_DIR environment variable not set.");
            process.exit(1);
        }

        const reportsDir = path.join(__dirname, '../reports');

        // 2. Create a versioned directory
        const now = new Date();
        const version = now.toISOString().replace(/[:.]/g, '-'); // e.g., 2024-01-27T15-30-00-000Z
        const versionedReportsDir = path.join(reportsDir, version);
        fs.mkdirSync(versionedReportsDir, { recursive: true });

        // 3. Copy Playwright report files.
        const sourceReportDir = path.join(__dirname, '..', PLAYWRIGHT_REPORT_DIR);
        if (!fs.existsSync(sourceReportDir)) {
            console.error(`ERROR: Playwright report directory not found: ${sourceReportDir}`);
            process.exit(1);
        }

        child_process.execSync(`cp -r "${sourceReportDir}/." "${versionedReportsDir}"`);
        console.log(`Playwright reports copied to: ${versionedReportsDir}`);

        // 4. Create an index page
        const reportDirs = fs.readdirSync(reportsDir)
            .filter(file => fs.statSync(path.join(reportsDir, file)).isDirectory()) // list directories
            .sort().reverse(); // sort them in reverse chronological order

        const linksHtml = reportDirs.map(dir => {
            return `<li><a href="./${dir}/index.html">${dir}</a></li>`;
        }).join('\n');

        const indexHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Playwright Test Reports</title>
        </head>
        <body>
            <h1>Playwright Test Reports</h1>
            <ul>
                ${linksHtml}
            </ul>
        </body>
        </html>
        `;
        fs.writeFileSync(path.join(reportsDir, 'index.html'), indexHtml, 'utf-8');

        // 5. create symlink
        const latest = path.join(reportsDir, "latest");

        // remove if exists
        if (fs.existsSync(latest))
        {
            fs.rmSync(latest, { force: true });
        }
        fs.symlinkSync(version, latest);


        // --- Git Operations ---
        // 6. Add all changes to the staging area
        child_process.execSync('git add .', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

        // 7. Commit the changes
        child_process.execSync(`git commit -m "Add Playwright report: ${version}"`, { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

        // 8. Push the changes to the 'main' branch
        child_process.execSync('git push origin main', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

        // --- NO GitHub Pages Deployment ---
        // We are *not* using gh-pages anymore.
        console.log('Reports committed and pushed to main branch!');

    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

deploy();