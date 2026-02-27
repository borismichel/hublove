import { printBanner } from "../cli/banner.js";
import { runPreflight } from "../wizard/preflight.js";

export async function initCommand(): Promise<void> {
  printBanner();
  await runPreflight();
}
