import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    try {
      if (process.platform === "win32") child.kill();
      else process.kill(-child.pid, "SIGTERM");
    } catch {
      // A process that already exited needs no cleanup.
    }
  }
  process.exitCode = exitCode;
}

for (const workspace of ["server", "client"]) {
  const child = spawn(npm, ["run", "dev", "--workspace", workspace], {
    stdio: "inherit",
    detached: process.platform !== "win32"
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(`${workspace} could not start: ${error.message}`);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
