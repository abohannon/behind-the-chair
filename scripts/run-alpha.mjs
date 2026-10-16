import { loadEnvFile } from "node:process";
import { spawn } from "node:child_process";
loadEnvFile(".env.alpha");
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", process.argv[2] ?? "dev"],
  { stdio: "inherit", env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
