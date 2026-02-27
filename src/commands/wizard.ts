import { printBanner } from "../cli/banner.js";
import { runPreflight } from "../wizard/preflight.js";
import { setupSource } from "../wizard/source.js";
import { setupTheme } from "../wizard/theme-setup.js";
import { runConversion } from "../wizard/conversion.js";
import { runUpload } from "../wizard/uploader.js";
import { showNextSteps } from "../wizard/next-steps.js";
import { saveConfig } from "../utils/config.js";

export async function wizardCommand(): Promise<void> {
  printBanner();

  // Step 1: Preflight checks
  const preflight = await runPreflight();

  // Step 2: Source setup
  const source = await setupSource();
  saveConfig({ lastSourcePath: source.sourceDir });

  // Step 3: Theme setup
  const themeInfo = await setupTheme();
  saveConfig({ lastThemePath: themeInfo.themePath });

  // Step 4: AI conversion
  await runConversion({
    aiEngine: preflight.aiEngine,
    sourceDir: source.sourceDir,
    themePath: themeInfo.themePath,
  });

  // Step 5: Upload
  await runUpload(themeInfo.themePath);

  // Step 6: Next steps + optional cleanup
  await showNextSteps({
    portalId: preflight.portalId,
    sourceDir: source.sourceDir,
    themePath: themeInfo.themePath,
    wasCloned: source.wasCloned,
  });
}
