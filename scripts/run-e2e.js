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

const child = spawn(npxCmd, ['playwright', 'test'], {
  stdio: 'inherit',
  env,
  shell: true,
});

child.on('close', (code) => {
  process.exit(code || 0);
});
