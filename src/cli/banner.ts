import { theme } from "./theme.js";

const VERSION = "0.2.0";

export function printBanner() {
  const o = theme.accent; // HubSpot orange for "hub"
  const v = theme.vibes;  // purple for "Vibes" + wave
  const m = theme.muted;

  // Block-pixel ASCII art: "hub ≋ Vibes"
  const lines = [
    `${o("██  ██ ██  ██ █████ ")}${v(" ≋≋≋≋≋≋≋≋  ")}${v("██  ██ ██ █████  ▄▄▄▄▄ ▄▄▄▄▄")}`,
    `${o("██  ██ ██  ██ ██  ██")}${v("  ≋≋≋≋≋≋   ")}${v("██  ██ ██ ██  ██ ██    ██   ")}`,
    `${o("██▀▀██ ██  ██ █████ ")}${v("   ≋≋≋≋    ")}${v("██  ██ ██ █████  ████  ▀▀▀▄ ")}`,
    `${o("██  ██ ██  ██ ██  ██")}${v("  ≋≋≋≋≋≋   ")}${v(" █▄▄█▀ ██ ██  ██ ██       ██")}`,
    `${o("██  ██  ████  █████ ")}${v(" ≋≋≋≋≋≋≋≋  ")}${v("  ▀▀▀  ██ █████  ▀▀▀▀▀ ▀▀▀▀ ")}`,
  ];

  console.log();
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  console.log();
  console.log(`  ${m("Lovable / React  →  HubSpot CMS")}    ${theme.dim(`v${VERSION}`)}`);
  console.log();
}
