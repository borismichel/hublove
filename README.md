# hubLove

Convert Lovable/React landing pages to HubSpot CMS — AI-powered CLI tool.

```
  ██  ██ ██  ██ █████  ▄██▄ ▄██▄  ██     ▄▄▄  ██  ██ ▄▄▄▄▄
  ██  ██ ██  ██ ██  ██ ██████████ ██    ██ ██ ██  ██ ██
  ██▀▀██ ██  ██ █████   ████████  ██    ██ ██ ██  ██ ████
  ██  ██ ██  ██ ██  ██   ██████   ██    ██ ██ ▀█▄▄█▀ ██
  ██  ██  ████  █████     ▀██▀    █████  ▀▀▀   ▀▀▀▀  ▀▀▀▀▀

  Lovable / React  →  HubSpot CMS
```

## What It Does

hubLove takes a React landing page (built with Lovable, v0, Bolt, or any React-based builder) and converts it into native HubSpot CMS modules — fully editable in the HubSpot page editor. No coding knowledge required.

It handles everything:
- Checks your environment and installs missing tools
- Clones your React repo from GitHub (or uses a local folder)
- Analyzes the component structure
- Uses AI to convert each section into a HubSpot module
- Uploads the result to your HubSpot portal
- Guides you through creating your landing page

## Setup Guide

### 1. Check if Node.js is installed

Open a terminal and run:

```bash
node -v
```

**Mac:** Open **Terminal** (press `Cmd + Space`, type "Terminal", press Enter).
**Windows:** Open **PowerShell** (press `Win + X`, choose "PowerShell") or **Command Prompt** (press `Win + R`, type `cmd`, press Enter).

If you see a version number like `v18.x.x` or higher — you're good, skip to step 2.

If you see "command not found" or an error, you need to install Node.js:

**Mac:**
```bash
# Option A: Download the installer from https://nodejs.org (pick the LTS version)

# Option B: If you have Homebrew installed:
brew install node
```

**Windows:**
1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS** version (the big green button)
3. Run the installer — accept all defaults
4. **Close and reopen** your terminal so it picks up the new install

After installing, run `node -v` again to confirm it works.

### 2. Install an AI Engine

hubLove needs an AI coding assistant to power the conversion. Install **one** of these (using `npm`, which comes bundled with Node.js):

| Engine | Install | Notes |
|--------|---------|-------|
| [Claude Code](https://claude.ai/code) | `npm install -g @anthropic-ai/claude-code` | Recommended — uses your Claude subscription |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `npm install -g @anthropic-ai/gemini-cli` | Uses your Google AI account |
| [OpenAI Codex](https://github.com/openai/codex) | `npm install -g @openai/codex` | Uses your OpenAI account |
| Anthropic API | No install — just need an API key | Get a key at [console.anthropic.com](https://console.anthropic.com) |

### 3. Run hubLove

```bash
npx hublove
```

The first time you run this, npm will ask:

```
Need to install the following packages: hublove
Ok to proceed? (y)
```

Type **y** and press Enter. It downloads hubLove and starts the wizard, which walks you through connecting to HubSpot, picking your AI engine, and converting your page.

> **Tip:** `npx` comes with Node.js. It downloads and runs tools without installing them permanently. After the first download, subsequent runs start immediately.

## After the Conversion

Once hubLove finishes uploading, your theme and modules are in HubSpot — but you still need to **create a landing page** that uses them:

1. Go to **HubSpot** → **Marketing** → **Landing Pages** → **Create**
2. Choose **your uploaded theme** from the theme picker
3. Select the landing page template that was just created
4. Your converted modules will appear — drag them onto the page
5. Click each section to edit text, images, and colors
6. Upload images via **File Manager** (Settings → Files)
7. Preview and publish!

## Commands

```bash
hublove              # Full interactive wizard (default)
hublove init         # Check and install required tools
hublove convert      # Convert a React project (no upload)
hublove upload       # Upload theme to HubSpot
hublove doctor       # Diagnose environment issues
```

Most users only need `npx hublove` — the wizard handles everything.

## How It Works

### Environment Check

hubLove checks for Node.js and the HubSpot CLI. If the HubSpot CLI is missing, it installs it for you via npm. If you're not authenticated, it runs `hs init` to connect your HubSpot portal.

### Source Setup

Paste your GitHub URL or point to a local folder. hubLove analyzes the component structure — counting components, detecting Tailwind, identifying interactive patterns (carousels, accordions, animations).

> **Note:** Cloning from GitHub requires Git. If you don't have Git installed, download your project as a ZIP, unzip it, and provide the local folder path instead.

### Theme Setup

Fetch your existing HubSpot theme or create a new one from the boilerplate. hubLove validates the theme structure and auto-patches `base.html` to support custom CSS/JS loading if needed.

### AI Conversion

Your chosen AI engine analyzes the React code and creates:
- **Shared CSS** — Design system variables, theme overrides, utilities
- **Shared JS** — Scroll animations, interactive features (vanilla JS)
- **Modules** — One per visual section, each with `fields.json`, `meta.json`, `module.html`, `module.css`
- **Page template** — Assembles all modules in a drag-and-drop area

### Upload & Auto-Fix

hubLove uploads everything to HubSpot. If uploads fail (common with field type issues), it auto-fixes known problems and retries:
- `textarea` → `text` (deprecated field type)
- `"name": "name"` → `"name": "item_name"` (reserved name)
- `now()` → `local_dt` (invalid HubL function)

## Configuration

Settings are saved in `~/.hublove/config.json` so you don't have to re-enter them:
- `aiEngine` — Your preferred AI engine (`claude-code`, `gemini-cli`, `codex-cli`, or `api`)
- `lastThemePath` — Last used theme directory
- `lastSourcePath` — Last used source directory

## Troubleshooting

**"command not found: node"** — Node.js isn't installed or isn't in your PATH. Re-install from [nodejs.org](https://nodejs.org) and restart your terminal.

**"hublove has not been built yet"** — You're running from source. Use `npx hublove` instead, or run `npm run build` first.

**HubSpot upload keeps failing** — Run `hublove doctor` to check your setup. Make sure `hs accounts list` shows your portal.

**AI conversion is slow or times out** — This is normal for large pages. The conversion can take 2-5 minutes depending on the number of components.

## Related

- [Conversion Guide](https://github.com/borismichel/lovable-to-hubspot) — Detailed technical guide for the React → HubSpot conversion process

## License

MIT
