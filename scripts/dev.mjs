import { spawn } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const viteArgs = [];

let port = '8080';

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];

  if (/^\d+$/.test(arg)) {
    port = arg;
    continue;
  }

  if (arg === '--port' && rawArgs[i + 1]) {
    port = rawArgs[i + 1];
    i += 1;
    continue;
  }

  viteArgs.push(arg);
}

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', '--host', '0.0.0.0', '--port', port, ...viteArgs],
  {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});