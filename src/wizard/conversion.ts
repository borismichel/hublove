import type { AIEngine, GeneratedAssets } from "../ai/engine.js";
import type { AIEngineType } from "../utils/config.js";
import { ClaudeCodeEngine } from "../ai/claude-code.js";
import { ClaudeAPIEngine } from "../ai/claude-api.js";
import { GeminiCLIEngine } from "../ai/gemini-cli.js";
import { CodexCLIEngine } from "../ai/codex-cli.js";
import { getConversionGuide } from "../ai/prompts.js";
import * as ui from "../prompts/prompter.js";

function createEngine(type: AIEngineType): AIEngine {
  switch (type) {
    case "claude-code":
      return new ClaudeCodeEngine();
    case "gemini-cli":
      return new GeminiCLIEngine();
    case "codex-cli":
      return new CodexCLIEngine();
    case "api":
      return new ClaudeAPIEngine();
  }
}

export async function runConversion(opts: {
  aiEngine: AIEngineType;
  sourceDir: string;
  themePath: string;
}): Promise<GeneratedAssets> {
  await ui.intro("Converting React to HubSpot Modules");

  await ui.note(
    "AI will now analyze your React code and create\nHubSpot-native modules. This takes 2-5 minutes.",
    "AI Conversion"
  );

  const engine = createEngine(opts.aiEngine);

  const conversionGuide = getConversionGuide();

  const s = await ui.spinner();
  s.start("Starting AI conversion...");

  const result = await engine.convert({
    sourceDir: opts.sourceDir,
    themePath: opts.themePath,
    conversionGuide,
    onProgress: (_step, detail) => {
      s.message(detail);
    },
  });

  s.stop("All files generated");

  // Summary
  const moduleCount = result.modules.length;
  const fileCount =
    result.modules.reduce(
      (sum, m) => sum + 3 + (m.moduleCss ? 1 : 0) + (m.moduleJs ? 1 : 0),
      0
    ) +
    (result.sharedCss ? 1 : 0) +
    (result.sharedJs ? 1 : 0) +
    (result.template ? 1 : 0);

  await ui.note(
    `${moduleCount} modules, 1 template, 1 CSS, 1 JS file created\nTotal: ${fileCount} files`,
    "Conversion complete!"
  );

  await ui.outro("Files ready for upload!");

  return result;
}
