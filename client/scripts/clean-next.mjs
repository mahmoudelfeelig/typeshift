import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const nextDirectory = fileURLToPath(new URL("../.next", import.meta.url));

rmSync(nextDirectory, { force: true, recursive: true });
