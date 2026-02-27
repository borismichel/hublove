import { join } from "node:path";
import { readdirSync } from "node:fs";
import { run } from "../utils/shell.js";
import { readFile, writeFile, fileExists } from "../utils/fs.js";
import * as ui from "../prompts/prompter.js";
import { theme } from "../cli/theme.js";

interface UploadError {
  file: string;
  message: string;
  fixable: boolean;
}

function parseUploadErrors(stderr: string): UploadError[] {
  const errors: UploadError[] = [];

  // textarea field type error
  if (/textarea.*not.*valid|unknown.*field.*type/i.test(stderr)) {
    const fileMatch = stderr.match(/(?:in|file:?)\s+(\S+fields\.json)/i);
    errors.push({
      file: fileMatch?.[1] || "fields.json",
      message: '"textarea" is not a valid field type',
      fixable: true,
    });
  }

  // name field reserved
  if (/missing field name|field null/i.test(stderr)) {
    const fileMatch = stderr.match(/(?:in|file:?)\s+(\S+fields\.json)/i);
    errors.push({
      file: fileMatch?.[1] || "fields.json",
      message: '"name" is a reserved field name',
      fixable: true,
    });
  }

  // now() function
  if (/could not resolve.*now/i.test(stderr)) {
    errors.push({
      file: "module.html",
      message: 'now() is not a valid HubL function',
      fixable: true,
    });
  }

  return errors;
}

function autoFix(themePath: string, error: UploadError): boolean {
  if (error.message.includes("textarea")) {
    // Find and fix all fields.json files
    return fixTextareaFields(themePath);
  }
  if (error.message.includes("reserved field name")) {
    return fixReservedNames(themePath);
  }
  if (error.message.includes("now()")) {
    return fixNowFunction(themePath);
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

    if (result.success) {
      s.stop("All files uploaded!");
      await ui.outro("Upload complete!");
      return true;
    }

    // Parse errors
    const errors = parseUploadErrors(result.stdout);

    if (errors.length === 0) {
      s.stop("Upload failed");
      ui.logError(`Upload failed. Error output:\n${result.stdout}`);

      if (attempt < MAX_RETRIES) {
        const retry = await ui.confirm({
          message: "Try uploading again?",
        });
        if (!retry) break;
        continue;
      }
      break;
    }

    // Try to auto-fix
    let anyFixed = false;
    for (const error of errors) {
      s.stop(`Error: ${error.message}`);

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

    if (!anyFixed) {
      // Try removing stuck modules
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
