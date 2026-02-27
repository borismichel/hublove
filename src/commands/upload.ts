import { printBanner } from "../cli/banner.js";
import { runUpload } from "../wizard/uploader.js";
import { loadConfig } from "../utils/config.js";
import * as ui from "../prompts/prompter.js";

export async function uploadCommand(): Promise<void> {
  printBanner();

  const config = loadConfig();

  if (!config.lastThemePath) {
    const path = await ui.text({
      message: "Path to your HubSpot theme directory:",
      placeholder: "./my-theme",
      validate: (v) => (v.trim() ? undefined : "Path is required"),
    });
    await runUpload(path);
  } else {
    const useLast = await ui.confirm({
      message: `Upload from ${config.lastThemePath}?`,
    });

    if (useLast) {
      await runUpload(config.lastThemePath);
    } else {
      const path = await ui.text({
        message: "Path to your HubSpot theme directory:",
        placeholder: "./my-theme",
      });
      await runUpload(path);
    }
  }
}
