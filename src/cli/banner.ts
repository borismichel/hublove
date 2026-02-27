import { theme } from "./theme.js";

const VERSION = "0.1.5";

export function printBanner() {
  const o = theme.accent; // HubSpot orange for "hub"
  const p = theme.love;   // pink for heart + "Love"
  const m = theme.muted;

  // Block-pixel ASCII art: "hub ♥ Love"
  // Fixed-width grid: hub(20) + heart(12) + love(24) = 56 chars per line
  const lines = [
    `${o("██  ██ ██  ██ █████ ")}${p(" ▄██▄ ▄██▄  ")}${p("██     ▄▄▄  ██  ██ ▄▄▄▄▄")}`,
    `${o("██  ██ ██  ██ ██  ██")}${p(" ██████████ ")}${p("██    ██ ██ ██  ██ ██   ")}`,
    `${o("██▀▀██ ██  ██ █████ ")}${p("  ████████  ")}${p("██    ██ ██ ██  ██ ████ ")}`,
    `${o("██  ██ ██  ██ ██  ██")}${p("   ██████   ")}${p("██    ██ ██ ▀█▄▄█▀ ██   ")}`,
    `${o("██  ██  ████  █████ ")}${p("    ▀██▀    ")}${p("█████  ▀▀▀   ▀▀▀▀  ▀▀▀▀▀")}`,
  ];

  console.log();
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  console.log();
  console.log(`  ${m("Lovable / React  →  HubSpot CMS")}    ${theme.dim(`v${VERSION}`)}`);
  console.log();
}
