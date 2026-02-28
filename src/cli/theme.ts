import chalk from "chalk";

export const palette = {
  accent: "#FF7A59",
  accentBright: "#FF9A7A",
  success: "#00BDA5",
  info: "#0066FF",
  warn: "#FFB020",
  error: "#E23D2D",
  muted: "#8B8D91",
  vibes: "#00BDD6",
};

const noColor = !!process.env.NO_COLOR;

function hex(color: string) {
  return noColor ? chalk : chalk.hex(color);
}

export const theme = {
  accent: hex(palette.accent),
  accentBright: hex(palette.accentBright),
  success: hex(palette.success),
  info: hex(palette.info),
  warn: hex(palette.warn),
  error: hex(palette.error),
  muted: hex(palette.muted),
  vibes: hex(palette.vibes),
  heading: noColor ? chalk.bold : chalk.bold.hex(palette.accent),
  command: hex(palette.accentBright),
  dim: chalk.dim,
  bold: chalk.bold,
};
