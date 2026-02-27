import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export function readFile(path: string): string {
  return readFileSync(path, "utf-8");
}

export function writeFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf-8");
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function resolveAsset(name: string): string {
  // In built package, assets/ is at the package root
  // During dev, it's relative to the project root
  const paths = [
    join(import.meta.dirname, "../../assets", name),
    join(import.meta.dirname, "../assets", name),
    join(process.cwd(), "assets", name),
  ];

  for (const p of paths) {
    if (existsSync(p)) return p;
  }

  throw new Error(`Asset not found: ${name}`);
}
