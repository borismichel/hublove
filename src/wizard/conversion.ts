import { join } from "node:path";
import { readdirSync } from "node:fs";
import type { AIEngine, GeneratedAssets } from "../ai/engine.js";
import type { AIEngineType } from "../utils/config.js";
import { ClaudeCodeEngine } from "../ai/claude-code.js";
import { ClaudeAPIEngine } from "../ai/claude-api.js";
import { GeminiCLIEngine } from "../ai/gemini-cli.js";
import { CodexCLIEngine } from "../ai/codex-cli.js";
import { getConversionGuide } from "../ai/prompts.js";
import { readFile, writeFile, fileExists } from "../utils/fs.js";
import * as ui from "../prompts/prompter.js";

function createEngine(type: AIEngineType, model?: string): AIEngine {
  switch (type) {
    case "claude-code":
      return new ClaudeCodeEngine(model);
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
  model?: string;
  sourceDir: string;
  themePath: string;
}): Promise<GeneratedAssets> {
  await ui.intro("Converting React to HubSpot Modules");

  await ui.note(
    "AI will now analyze your React code and create\nHubSpot-native modules. This takes 2-5 minutes.",
    "AI Conversion"
  );

  const engine = createEngine(opts.aiEngine, opts.model);

  const conversionGuide = getConversionGuide();

  const s = await ui.spinner();
  s.start("Starting AI conversion...");

  const startTime = Date.now();

  const result = await engine.convert({
    sourceDir: opts.sourceDir,
    themePath: opts.themePath,
    conversionGuide,
    onProgress: (_step, detail) => {
      s.message(detail);
    },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  s.stop(`All files generated (${elapsed}s)`);

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

  // Validate and fix template annotations + module meta
  validateTemplates(opts.themePath);
  validateModuleMeta(opts.themePath);

  await ui.outro("Files ready for upload!");

  return result;
}

/**
 * Ensure all templates in templates/ have the required HubSpot annotations.
 * Without `templateType: page` and `isAvailableForNewContent: true`,
 * the template won't appear in HubSpot's template picker.
 */
export function validateTemplates(themePath: string): void {
  const templatesDir = join(themePath, "templates");
  if (!fileExists(templatesDir)) return;

  for (const file of readdirSync(templatesDir)) {
    if (!file.endsWith(".html") || file === "base.html" || file.startsWith("system")) continue;

    const filePath = join(templatesDir, file);
    let content = readFile(filePath);

    // Skip files that don't look like page templates
    if (!content.includes("dnd_area") && !content.includes("extends")) continue;

    const hasTemplateType = /templateType\s*:\s*page/i.test(content);
    const hasAvailable = /isAvailableForNewContent\s*:\s*true/i.test(content);

    if (hasTemplateType && hasAvailable) continue;

    // Build the annotation block
    const label = file.replace(".html", "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    if (content.includes("<!--") && content.indexOf("-->") < 200) {
      // Has an existing comment block at the top — patch it
      const commentEnd = content.indexOf("-->");
      let annotation = content.slice(0, commentEnd);

      if (!hasTemplateType) {
        annotation += "\n  templateType: page";
      }
      if (!hasAvailable) {
        annotation += "\n  isAvailableForNewContent: true";
      }
      if (!/label\s*:/i.test(annotation)) {
        annotation += `\n  label: ${label}`;
      }

      content = annotation + content.slice(commentEnd);
    } else {
      // No annotation block — prepend one
      const block = `<!--\n  templateType: page\n  isAvailableForNewContent: true\n  label: ${label}\n-->\n`;
      content = block + content;
    }

    writeFile(filePath, content);
    ui.logSuccess(`Template "${file}" — annotations verified`);
  }

}

/**
 * Ensure all module meta.json files have the required fields for
 * landing page compatibility.
 */
export function validateModuleMeta(themePath: string): void {
  const modulesDir = join(themePath, "modules");
  if (!fileExists(modulesDir)) return;

  for (const entry of readdirSync(modulesDir)) {
    if (!entry.endsWith(".module")) continue;
    const metaPath = join(modulesDir, entry, "meta.json");
    if (!fileExists(metaPath)) continue;

    try {
      const meta = JSON.parse(readFile(metaPath));
      let changed = false;

      if (!meta.host_template_types || !meta.host_template_types.includes("PAGE")) {
        meta.host_template_types = ["PAGE"];
        changed = true;
      }
      if (!meta.is_available_for_new_content) {
        meta.is_available_for_new_content = true;
        changed = true;
      }

      if (changed) {
        writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n");
      }
    } catch {
      // Skip malformed meta.json
    }
  }
}
