import { spawn } from 'child_process';

const envType = process.argv[2] || 'dev';
const targetUrls = {
  dev: 'https://eat-log-git-dev-omkar-chavans-projects.vercel.app',
  prod: 'https://eattlog.vercel.app',
  local: 'http://localhost:3000',
};

const baseUrl = targetUrls[envType] || envType;
console.log(`\n======================================================`);
console.log(`🚀 Running Live E2E UI Scenarios against: ${baseUrl}`);
console.log(`   Target Environment: ${envType}`);
console.log(`======================================================\n`);

const env = { ...process.env, BASE_URL: baseUrl };
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const nodeCmd = isWindows ? 'node.exe' : 'node';

// Step 1: Run Live API & Model Smoke Test
console.log(`[Step 1/2] Verifying Live API & Candidate Models...`);
const apiSmoke = spawn(nodeCmd, ['scripts/test-live-api.js', envType], {
  stdio: 'inherit',
  env,
  shell: true,
});

apiSmoke.on('close', (smokeCode) => {
  if (smokeCode !== 0) {
    console.error(`\n❌ Live API Smoke Test failed with exit code ${smokeCode}. Aborting E2E UI tests.\n`);
    process.exit(smokeCode);
  }

  // Step 2: Run Playwright E2E UI Scenarios
  console.log(`[Step 2/2] Running Playwright E2E UI Scenarios...`);
  const child = spawn(npxCmd, ['playwright', 'test'], {
    stdio: 'inherit',
    env,
    shell: true,
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });
});
