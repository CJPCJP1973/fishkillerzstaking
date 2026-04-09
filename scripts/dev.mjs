import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const numericArg = [...args].reverse().find((arg) => /^\d+$/.test(arg));
const port = Number.parseInt(process.env.PORT ?? numericArg ?? "8080", 10);

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "--host", "0.0.0.0", "--port", String(port)],
  {
    stdio: "inherit",
    env: process.env,
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
