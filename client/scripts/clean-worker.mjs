import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const outputDirectory = fileURLToPath(new URL("../.open-next", import.meta.url));

rmSync(outputDirectory, {
  force: true,
  maxRetries: 5,
  recursive: true,
  retryDelay: 250,
});
