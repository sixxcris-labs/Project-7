# Favorite-Mistake ↔ LEAN Full Integration Build

This monorepo provides:

- `favorite-mistake-service/` — TypeScript/Node microservice exposing robust stats, regime, toxicity, drift, and gate APIs.
- `fm-sdk-python/` — Python SDK client for the service, to be used inside LEAN algos and research.
- `schemas/` — JSON Schemas for all public API payloads.
- `lean-integration/` — Example LEAN strategy showing how to call the FM service via the SDK.
- `ci/` — Example CI pipeline for building, testing, and packaging.

All code is scaffolded for production hardening: mTLS, logging, metrics, and config layering can be added without breaking public contracts.
