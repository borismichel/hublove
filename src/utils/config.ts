import { join } from "node:path";
import { homedir } from "node:os";
import { readFile, writeFile, fileExists } from "./fs.js";

export type AIEngineType = "claude-code" | "api" | "gemini-cli" | "codex-cli";

export interface HubVibesConfig {
  aiEngine?: AIEngineType;
  anthropicApiKey?: string;
  lastThemePath?: string;
  lastSourcePath?: string;
}

const CONFIG_DIR = join(homedir(), ".hubvibes");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export function loadConfig(): HubVibesConfig {
  if (!fileExists(CONFIG_PATH)) return {};

  try {
    return JSON.parse(readFile(CONFIG_PATH));
  } catch {
    return {};
  }
}

export function saveConfig(config: HubVibesConfig): void {
  const existing = loadConfig();
  const merged = { ...existing, ...config };
  writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2));
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
