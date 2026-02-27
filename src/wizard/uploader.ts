import { join } from "node:path";
import { readdirSync, rmSync } from "node:fs";
import { run } from "../utils/shell.js";
import { readFile, writeFile, fileExists } from "../utils/fs.js";
import * as ui from "../prompts/prompter.js";
import { theme } from "../cli/theme.js";

interface UploadError {
  file: string;
  message: string;
  fixable: boolean;
}

/** Count "Uploaded file" lines in hs upload output */
function countUploadedFiles(output: string): number {
  return (output.match(/^Uploaded file /gm) || []).length;
}

function parseUploadErrors(output: string): UploadError[] {
  const errors: UploadError[] = [];

  // textarea field type error
  if (/textarea.*not.*valid|unknown.*field.*type/i.test(output)) {
    const fileMatch = output.match(/(?:in|file:?)\s+(\S+fields\.json)/i);
    errors.push({
      file: fileMatch?.[1] || "fields.json",
      message: '"textarea" is not a valid field type',
      fixable: true,
    });
  }

  // name field reserved
  if (/missing field name|field null/i.test(output)) {
    const fileMatch = output.match(/(?:in|file:?)\s+(\S+fields\.json)/i);
    errors.push({
      file: fileMatch?.[1] || "fields.json",
      message: '"name" is a reserved field name',
      fixable: true,
    });
  }

  // now() function
  if (/could not resolve.*now/i.test(output)) {
    errors.push({
      file: "module.html",
      message: 'now() is not a valid HubL function',
      fixable: true,
    });
  }

  // HubDB requires CMS Hub Pro/Enterprise
  if (/hubdb|do not have access to hubdb/i.test(output)) {
    errors.push({
      file: "templates",
      message: "HubDB requires CMS Hub Pro/Enterprise",
      fixable: true,
    });
  }

  // Link field invalid default value
  if (/invalid default value|link.*field.*invalid/i.test(output)) {
    const fieldMatch = output.match(/field.*?(\w+)\s+has an invalid/i);
    errors.push({
      file: fieldMatch?.[1] || "fields.json",
      message: `Link field "${fieldMatch?.[1] || "unknown"}" has invalid default value`,
      fixable: true,
    });
  }

  // Deserialization error (catch-all for fields.json issues)
  if (/failed to deserialize/i.test(output)) {
    const fileMatch = output.match(/file '([^']+)'/i);
    errors.push({
      file: fileMatch?.[1] || "fields.json",
      message: "fields.json deserialization error",
      fixable: true,
    });
  }

  return errors;
}

function autoFix(themePath: string, error: UploadError): boolean {
  if (error.message.includes("textarea")) {
    return fixTextareaFields(themePath);
  }
  if (error.message.includes("reserved field name")) {
    return fixReservedNames(themePath);
  }
  if (error.message.includes("now()")) {
    return fixNowFunction(themePath);
  }
  if (error.message.includes("HubDB")) {
    return fixHubDbTemplates(themePath);
  }
  if (error.message.includes("invalid default value") || error.message.includes("deserialization")) {
    return fixLinkFieldDefaults(themePath);
  }
  return false;
}

function fixTextareaFields(themePath: string): boolean {
  let fixed = false;
  const modulesDir = join(themePath, "modules");

  if (!fileExists(modulesDir)) return false;

  for (const entry of readdirSync(modulesDir)) {
    if (!entry.endsWith(".module")) continue;
    const fieldsPath = join(modulesDir, entry, "fields.json");
    if (!fileExists(fieldsPath)) continue;

    let content = readFile(fieldsPath);
    if (content.includes('"textarea"')) {
      content = content.replace(/"textarea"/g, '"text"');
      writeFile(fieldsPath, content);
      fixed = true;
    }
  }

  return fixed;
}

function fixReservedNames(themePath: string): boolean {
  let fixed = false;
  const modulesDir = join(themePath, "modules");

  if (!fileExists(modulesDir)) return false;

  for (const entry of readdirSync(modulesDir)) {
    if (!entry.endsWith(".module")) continue;
    const fieldsPath = join(modulesDir, entry, "fields.json");
    if (!fileExists(fieldsPath)) continue;

    let content = readFile(fieldsPath);
    // Replace "name": "name" with "name": "item_name"
    if (/"name":\s*"name"/g.test(content)) {
      content = content.replace(/"name":\s*"name"/g, '"name": "item_name"');
      writeFile(fieldsPath, content);
      fixed = true;
    }
  }

  return fixed;
}

function fixNowFunction(themePath: string): boolean {
  let fixed = false;
  const modulesDir = join(themePath, "modules");

  if (!fileExists(modulesDir)) return false;

  for (const entry of readdirSync(modulesDir)) {
    if (!entry.endsWith(".module")) continue;
    const htmlPath = join(modulesDir, entry, "module.html");
    if (!fileExists(htmlPath)) continue;

    let content = readFile(htmlPath);
    if (content.includes("now()")) {
      content = content.replace(/now\(\)/g, "local_dt");
      writeFile(htmlPath, content);
      fixed = true;
    }
  }

  return fixed;
}

function fixHubDbTemplates(themePath: string): boolean {
  let fixed = false;
  const templatesDir = join(themePath, "templates");
  if (!fileExists(templatesDir)) return false;

  for (const file of readdirSync(templatesDir)) {
    if (!file.endsWith(".html")) continue;
    const filePath = join(templatesDir, file);
    const content = readFile(filePath);
    if (content.includes("hubdb_table") || content.includes("hubdb_table_rows")) {
      rmSync(filePath);
      fixed = true;
    }
  }

  return fixed;
}

function fixLinkFieldDefaults(themePath: string): boolean {
  let fixed = false;
  const modulesDir = join(themePath, "modules");
  if (!fileExists(modulesDir)) return false;

  for (const entry of readdirSync(modulesDir)) {
    if (!entry.endsWith(".module")) continue;
    const fieldsPath = join(modulesDir, entry, "fields.json");
    if (!fileExists(fieldsPath)) continue;

    try {
      const fields = JSON.parse(readFile(fieldsPath));
      if (fixLinkFieldsRecursive(fields)) {
        writeFile(fieldsPath, JSON.stringify(fields, null, 2) + "\n");
        fixed = true;
      }
    } catch {
      // Skip malformed JSON
    }
  }
  return fixed;
}

function fixLinkFieldsRecursive(fields: unknown[]): boolean {
  let fixed = false;
  for (const field of fields) {
    if (typeof field !== "object" || field === null) continue;
    const f = field as Record<string, unknown>;

    if (f.type === "link") {
      const def = f.default;
      const needsFix =
        typeof def === "string" ||
        def === undefined ||
        def === null ||
        (typeof def === "object" && !(def as Record<string, unknown>).url);

      if (needsFix) {
        const href = typeof def === "string" ? def : "";
        f.default = {
          url: { href, type: "EXTERNAL" },
          open_in_new_tab: false,
          no_follow: false,
        };
        fixed = true;
      }
    }

    if (Array.isArray(f.children)) {
      if (fixLinkFieldsRecursive(f.children as unknown[])) fixed = true;
    }
  }
  return fixed;
}

export async function runUpload(themePath: string): Promise<boolean> {
  await ui.intro("Uploading to HubSpot");

  const themeName = themePath.split("/").pop() || themePath;
  const s = await ui.spinner();

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    s.start(
      attempt === 1
        ? "Uploading theme..."
        : `Retrying upload (attempt ${attempt}/${MAX_RETRIES})...`
    );

    const result = run(`hs upload "${themePath}" "${themeName}"`, {
      cwd: join(themePath, ".."),
    });

    // Combine stdout + stderr — hs upload logs success lines and errors to both
    const fullOutput = [result.stdout, result.stderr].filter(Boolean).join("\n");
    const uploadedCount = countUploadedFiles(fullOutput);

    if (result.success) {
      s.stop(`All files uploaded! (${uploadedCount} files)`);
      await ui.outro("Upload complete!");
      return true;
    }

    // Parse errors from combined output
    const errors = parseUploadErrors(fullOutput);

    // If files were uploaded despite errors, tell the user
    if (uploadedCount > 0) {
      s.stop(`${uploadedCount} files uploaded, but some errors occurred`);
    } else {
      s.stop("Upload failed");
    }

    if (errors.length === 0) {
      // Unknown error — show raw output
      ui.logError(`Upload error:\n${fullOutput.slice(0, 500)}`);

      if (uploadedCount > 0) {
        ui.logWarn(
          "Most files uploaded successfully. The theme may already be usable in HubSpot.\n" +
          "You can check your HubSpot Design Manager to verify."
        );
        const proceed = await ui.confirm({
          message: "Continue anyway (theme is likely uploaded)?",
          initialValue: true,
        });
        if (proceed) return true;
      }

      if (attempt < MAX_RETRIES) {
        const retry = await ui.confirm({
          message: "Try uploading again?",
        });
        if (!retry) break;
        continue;
      }
      break;
    }

    // Try to auto-fix known errors
    let anyFixed = false;
    for (const error of errors) {
      if (error.fixable) {
        const fixed = autoFix(themePath, error);
        if (fixed) {
          ui.logSuccess(`Auto-fixed: ${error.message}`);
          anyFixed = true;
        } else {
          ui.logWarn(`Could not auto-fix: ${error.message}`);
        }
      } else {
        ui.logError(error.message);
      }
    }

    if (anyFixed && attempt < MAX_RETRIES) {
      // Retry after fixes
      continue;
    }

    // If files were uploaded, offer to continue despite errors
    if (uploadedCount > 0) {
      ui.logWarn(
        `${uploadedCount} files uploaded successfully despite errors.\n` +
        "The theme may work — check HubSpot Design Manager."
      );
      const proceed = await ui.confirm({
        message: "Continue anyway?",
        initialValue: true,
      });
      if (proceed) return true;
    }

    if (!anyFixed) {
      // Try removing stuck modules as last resort
      s.start("Cleaning up stuck modules...");
      run(`hs remove "${themeName}/modules"`, {
        cwd: join(themePath, ".."),
      });
      s.stop("Cleaned up modules, retrying...");
    }
  }

  ui.logError(
    "Upload failed after multiple attempts. Try running `hs upload` manually to see detailed errors."
  );
  return false;
}
