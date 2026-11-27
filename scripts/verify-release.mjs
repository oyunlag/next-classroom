import { spawnSync } from "node:child_process";

const mongo = process.env.MONGODB_TEST_BINARY || "mongod";
const probe = spawnSync(mongo, ["--version"], { stdio: "ignore" });
if (probe.status !== 0) {
  console.error(
    "Release verification requires a working mongod. Install MongoDB or set MONGODB_TEST_BINARY to its executable.",
  );
  process.exit(1);
}

const env = { ...process.env, MONGODB_TEST_BINARY: mongo };
for (const args of [
  ["test"],
  ["run", "lint"],
  ["run", "build"],
  ["run", "typecheck"],
]) {
  const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, ...args],
    {
      env,
      stdio: "inherit",
    },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
