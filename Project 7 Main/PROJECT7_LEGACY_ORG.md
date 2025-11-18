# Project 7 – Legacy & Repo Organization Instructions

You are my senior repo/filesystem organization assistant. I’m on **Windows** using **PowerShell**.

## Current Top-Level Layout

Root folder:

`C:\Users\Cristian\Desktop\Project 7 Main`

Current subfolders:

- `__root_backup_2025-11-18` – backup of stray Node artifacts from earlier; nothing should depend on it now, but I’m keeping it as a safety net.
- `legacy_prototypes` – a dump of older experiments and prototype projects (multiple backends, apps, microservices, etc.).
- `Project7_CryptoBot_Dev` – this is my **active, real repo**. This is the project I actually build, run, and commit from. It also contains a `.claude` folder with Claude-specific config for this repo.

From your point of view:

- **`Project7_CryptoBot_Dev` is read-only**: you may inspect it for reference, but do **not** move/rename/delete anything inside it and do not generate shell commands that touch it.
- Your main job is to help me organize **`legacy_prototypes`** and advise about the backup folder.

---

## My Goals

1. Have a **clean, understandable structure** inside `legacy_prototypes` where:
   - Each major prototype or project has a clear, descriptive folder name.
   - It’s obvious what each prototype is (e.g. original Fastify backend, GPT Actions experiment, trading strategy sandbox, etc.).
   - Anything clearly redundant or obsolete is marked as “safe to archive/delete later” (but not deleted automatically).

2. Make it easy for “future me” to quickly see:
   - What each prototype does.
   - Whether it contains code or ideas I might want to reuse in `Project7_CryptoBot_Dev`.

3. Get a concrete, minimal set of **PowerShell commands** to:
   - Create any new subfolders you recommend inside `legacy_prototypes`.
   - Move/rename existing folders there to clearer names (e.g. `01-fastify-backend-original`, `02-favorite-mistake-service`, `03-gpt-action-microservices`, etc.).
   - Optionally create a `README.md` inside `legacy_prototypes` that documents everything.

4. Optionally, after inspecting a shallow listing of `__root_backup_2025-11-18`, tell me whether it’s safe to delete that backup or if any part of it might still be useful. **Do not** give delete commands for the backup; advice only.

---

## How I Want You To Work

### 1. Discover the contents of `legacy_prototypes` (shallow only)

First, ask me to run this in PowerShell and paste the output:

```powershell
Set-Location "C:\Users\Cristian\Desktop\Project 7 Main\legacy_prototypes"
Get-ChildItem -Directory | Select-Object Name, FullName
```

Use that to see the top-level folders only.

If you need to see inside any specific folder(s), ask me to run the same command inside those particular folders, for example:

```powershell
Set-Location "C:\Users\Cristian\Desktop\Project 7 Main\legacy_prototypes\<SOME_FOLDER>"
Get-ChildItem -Directory | Select-Object Name, FullName
```

Avoid `tree /F` or anything that dumps `node_modules`: the trees are huge.

---

### 2. Classify and rename prototypes

Based on those listings:

- Classify each top-level folder in `legacy_prototypes` as one of:
  - Full project / service
  - Partial prototype / experiment
  - Config / utilities
  - Clearly redundant or obsolete (if it is obvious)

- Propose a **clear, indexed naming scheme** so related items are grouped together. Examples (you’ll adapt these to the actual contents):

  - `01-fastify-backend-original`
  - `01-fastify-backend-alt-spike`
  - `02-gpt-action-microservices`
  - `03-strategy-sandbox-futures`
  - `04-dashboard-ui-experiment`

You can either:

- Use index prefixes only, **or**
- Create a small number of thematic subfolders (e.g. `backend/`, `gpt-actions/`, `strategies/`) and put numbered projects inside them.

Choose whichever is simpler and clearer given the real contents.

---

### 3. Propose a target structure

Once you understand what’s in there, design a **target directory structure** for `legacy_prototypes` and show it as a simple tree (directories only). Make it very clear:

- `Project7_CryptoBot_Dev` – **ACTIVE REPO** (no changes).
- `legacy_prototypes` – **LEGACY / REFERENCE AREA** you are organizing.
- Subfolders and renamed projects inside `legacy_prototypes`.

---

### 4. Generate exact PowerShell commands

After you show the target structure, give me the **exact PowerShell commands** to transform the current `legacy_prototypes` layout into your proposed structure.

Assume I will run them from:

```powershell
Set-Location "C:\Users\Cristian\Desktop\Project 7 Main\legacy_prototypes"
```

Include:

- `New-Item -ItemType Directory` for any new subfolders.
- `Move-Item` and `Rename-Item` commands for reorganization and renaming.

Be explicit with paths and names so I can copy–paste.

---

### 5. Write a `README.md` for `legacy_prototypes`

Write the full content for a `README.md` that I will save as:

`C:\Users\Cristian\Desktop\Project 7 Main\legacy_prototypes\README.md`

This README should:

- List each prototype/project with:
  - New folder name
  - 1–3 sentence description of what it is / why it existed

- Mark clearly:
  - Items that are **good candidates for reuse** in `Project7_CryptoBot_Dev`.
  - Items that are **probably safe to archive/delete later**.

Keep it straightforward and scannable (headings, bullet points).

---

### 6. Optional: Assess `__root_backup_2025-11-18`

If I provide a shallow directory listing for:

`C:\Users\Cristian\Desktop\Project 7 Main\__root_backup_2025-11-18`

then:

- Tell me what it looks like (e.g. old `.next`, `node_modules`, `package.json` at the parent level).
- Say whether it’s likely safe to delete the entire backup, or whether any files might still matter.
- **Do not** output delete commands for this folder; just advise.

---

## Constraints & Style

- Never propose moving or renaming anything inside `Project7_CryptoBot_Dev`. That repo is off-limits for modifications.
- Avoid any deep recursive listings that pull in `node_modules`.
- Prefer the smallest number of moves/renames that make the legacy area understandable.
- Don’t refactor code or change file contents; this is purely filesystem organization + documentation.
- When in doubt, mark something as “candidate to archive later” rather than assuming it can be thrown away.

At the end, summarize:

- The “before vs after” structure of `legacy_prototypes`.
- The main categories of prototypes you found.
- What you recommend I actually revisit vs what I can probably archive or delete later.
