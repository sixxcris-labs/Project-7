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
- `final upgrades.md`: Marked Gate 0.2 (quant baseline) as completed after creating the venv, installing requirements, and successfully hitting `/analysis` and `/trade-plan/generate` via FastAPI `TestClient`.
- `final upgrades.md`: Marked Gate 1 (zod schemas, PaperStore sanity, and MultiAgentService coverage) as complete after centralizing schemas, adding validation tests, and confirming PaperStore structure + quant integration.
- `final upgrades.md`: Marked Gate 2 (legacy UI staging, dashboard/trading upgrades) as complete after adding legacy UI panels, buttons, and styled dashboards that still consume the existing APIs.
- `final upgrades.md`: Marked Gate 3 (market data endpoint and guarded live execution skeleton) as complete after wiring the market data service and live approval path behind config flags.
- `final upgrades.md`: Marked Gate 4 (advanced quant logic) as complete after integrating legacy Kelly/Monte Carlo helpers into the quant service and enriching the `/analysis` and `/trade-plan/generate` payloads without breaking contracts.
- `docs/FUTURE_BACKLOG.md`: Captures the Gate 5 wishlist (risk profiles, trade history, live switch, risk sentinel, LLM/SaaS hardening) so future work stays scoped.
- `final upgrades.md`: Marked Gate 5 (LLM copilot service + GPT tooling) as complete after adding GPT tools, the assistant service, and the `/api/ai/ask` endpoint while keeping GPT strictly read-only.
- `final upgrades.md`: Added guidance for agent-specific GPT copilots so Analyst, Researcher, Trader, Risk, and PM agents can each invoke tailored system prompts and tool subsets while reusing the safe, read-only APIs.

### Removed
- `PROJECT7_V3_FINAL_UPGRADE_GATE_PLAN.md`: Gate content was merged into `final upgrades.md` to avoid duplicated instructions.
- `Project 7 Main/` legacy tree: deleted redundant copy of `Project7_CryptoBot_Dev` now that `legacy_original_project7_main/Project7_CryptoBot_Dev` remains as the canonical reference.
