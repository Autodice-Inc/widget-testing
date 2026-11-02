/* eslint-disable no-console */
import { execSync } from 'child_process';
import fs from 'fs';

console.log('Pulling latest changes from develop...');
execSync('git checkout develop', { stdio: 'inherit' });
execSync('git pull origin develop', { stdio: 'inherit' });

const bumpType = process.argv[2] || 'patch'; // patch/minor/major

console.log(`Bumping version (${bumpType})...`);
const newVersion = execSync(`npm version ${bumpType} --no-git-tag-version`).toString().trim().replace(/^v/, '');
console.log(`Version bumped to ${newVersion}`);

const branchName = `release/${newVersion}`;
console.log(`Creating and switching to branch ${branchName}...`);
execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

let filesToAdd = ['package.json'];

const lockFiles = ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml'];

for (const lockFile of lockFiles) {
  if (fs.existsSync(lockFile)) {
    try {
      const diff = execSync(`git diff --name-only ${lockFile}`).toString().trim();
      if (diff) {
        console.log(`Detected changes in ${lockFile}, adding it to commit...`);
        filesToAdd.push(lockFile);
      }
    } catch (err) {
      console.warn(`Could not check diff for ${lockFile}:`, err.message);
    }
  }
}

execSync(`git add ${filesToAdd.join(' ')}`, { stdio: 'inherit' });
execSync(`git commit -m "Release: ${newVersion}"`, { stdio: 'inherit' });

console.log(`Tagging release v${newVersion}...`);
execSync(`git tag -a v${newVersion} -m "Release ${newVersion}"`, { stdio: 'inherit' });
execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });

execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });

console.log('Release branch created and pushed successfully!');
