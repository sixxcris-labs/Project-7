# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- `final upgrades.md`: Single, prioritized implementation and merge plan for V3 + legacy, including quant, risk sentinel, and live quotes integration.

### Changed
- `README.md`: Replaced minimal stub with a full conceptual overview of PROJECT7_V3 as a multi-agent, LLM-powered “trading firm in a box” with a Next.js control dashboard.
- `apps/backend/tsconfig.json`: Updated `module` to `ES2022` to support top-level `await` in the backend bootstrap.
- `apps/backend/package.json`: Added `vitest` as a devDependency to satisfy the existing test script and TypeScript module resolution.
- `apps/frontend/src/stores/tradingSessionStore.ts`: Typed the trading session store and reformatted it for clarity so the Next.js TypeScript build passes cleanly.
- `final upgrades.md`: Replaced the old priority-style plan with the consolidated Gate 0–5 upgrade plan so there is a single, checkbox-oriented path to merge V3 with legacy improvements.
- `final upgrades.md`: Marked Gate 0.1 (tooling/env/build sanity) as completed after verifying Node 24.10.0, Python 3.11.9, root `npm install`, `.env` creation, and `npm run build`.

### Removed
- `PROJECT7_V3_FINAL_UPGRADE_GATE_PLAN.md`: Gate content was merged into `final upgrades.md` to avoid duplicated instructions.
- `Project 7 Main/` legacy tree: deleted redundant copy of `Project7_CryptoBot_Dev` now that `legacy_original_project7_main/Project7_CryptoBot_Dev` remains as the canonical reference.
