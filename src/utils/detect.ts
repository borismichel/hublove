import { join } from "node:path";
import { homedir } from "node:os";
import { readFileSync, existsSync } from "node:fs";
import { run } from "./shell.js";

export interface ToolInfo {
  name: string;
  found: boolean;
  version: string;
  path: string;
}

export function detectNode(): ToolInfo {
  const result = run("node --version");
  return {
    name: "Node.js",
    found: result.success,
    version: result.stdout.replace(/^v/, ""),
    path: run("which node").stdout,
  };
}

export function detectGit(): ToolInfo {
  const result = run("git --version");
  return {
    name: "Git",
    found: result.success,
    version: result.stdout.replace("git version ", ""),
    path: run("which git").stdout,
  };
}

export function detectHubSpotCLI(): ToolInfo {
  const result = run("hs --version");
  return {
    name: "HubSpot CLI",
    found: result.success,
    version: result.stdout,
    path: run("which hs").stdout,
  };
}

export function detectClaudeCode(): ToolInfo {
  const result = run("claude --version");
  return {
    name: "Claude Code",
    found: result.success,
    version: result.stdout,
    path: run("which claude").stdout,
  };
}

export function detectDataCenter(portalId: string): string {
  try {
    const configPath = join(homedir(), ".hscli", "config.yml");
    if (!existsSync(configPath)) return "na1";

    const config = readFileSync(configPath, "utf-8");

    // Find the account block matching this portal ID
    const accountIdx = config.indexOf(`accountId: ${portalId}`);
    if (accountIdx === -1) return "na1";

    // Look for personalAccessKey after this account entry
    const keyIdx = config.indexOf("personalAccessKey:", accountIdx);
    if (keyIdx === -1) return "na1";

    // Extract the key value (next non-empty trimmed line after the label)
    const keySection = config.slice(keyIdx, keyIdx + 300);
    const keyMatch = keySection.match(/personalAccessKey:[\s>-]*\n\s+(\S+)/);
    if (!keyMatch) return "na1";

    // CiRldTE = base64 prefix for "eu1" datacenter in HubSpot personal access keys
    if (keyMatch[1].startsWith("CiRldTE")) return "eu1";
  } catch {
    // Fall through to default
  }
  return "na1";
}

export function detectHubSpotAuth(): {
  authenticated: boolean;
  portalName: string;
  portalId: string;
} {
  const result = run("hs accounts list");
  if (!result.success || !result.stdout) {
    return { authenticated: false, portalName: "", portalId: "" };
  }

  // Parse portal info from "hs accounts list" output
  // Default account line: "Account: name [standard] (123456)"
  const defaultMatch = result.stdout.match(/Account:\s*(.+?)\s*\((\d+)\)/);
  if (defaultMatch) {
    return {
      authenticated: true,
      portalName: defaultMatch[1].trim(),
      portalId: defaultMatch[2].trim(),
    };
  }

  // Table row: "name [standard]  123456  personalaccesskey"
  const lines = result.stdout.split("\n");
  for (const line of lines) {
    const tableMatch = line.match(/^\s*(.+?)\s{2,}(\d{5,})\s/);
    if (tableMatch && !/Account ID/i.test(line)) {
      return {
        authenticated: true,
        portalName: tableMatch[1].trim(),
        portalId: tableMatch[2].trim(),
      };
    }
  }

  return {
    authenticated: result.stdout.length > 0,
    portalName: "",
    portalId: "",
  };
}

export function detectGeminiCLI(): ToolInfo {
  const result = run("gemini --version");
  return {
    name: "Gemini CLI",
    found: result.success,
    version: result.stdout,
    path: run("which gemini").stdout,
  };
}

export function detectCodexCLI(): ToolInfo {
  const result = run("codex --version");
  return {
    name: "OpenAI Codex CLI",
    found: result.success,
    version: result.stdout,
    path: run("which codex").stdout,
  };
}

export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function nodeVersionOk(version: string): boolean {
  const major = parseInt(version.split(".")[0], 10);
  return major >= 18;
}
