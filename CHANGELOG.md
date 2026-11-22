# Changelog — PromptBench

All notable changes to the PromptBench platform are documented below.

## [1.0.0] - 2026-11-22
### Added
- **Module 1 (Test Case Manager):** Full CRUD REST API with 12 predefined test cases for customer email triage (6 Normal, 4 Edge, 2 Invalid).
- **Module 2 (Prompt Manager):** Version tracking for prompt templates (`v1`, `v2`, `v3`) with parameter controls (temperature) and change notes.
- **Module 3 (LLM Runner):** Multi-model runner orchestrating Google Gemini (`gemini-1.5-flash`) and Groq (`llama-3.1-8b-instant`) with exponential backoff retries.
- **Module 4 (Evaluator):** Dual evaluation engine featuring Python LLM-as-a-judge (Accuracy & Relevance), Scikit-Learn TF-IDF cross-run semantic consistency, and TypeScript rule-based instruction-following validation.
- **Module 5 (Results Dashboard):** Interactive analytics dashboard with dynamic weight sliders, Recharts bar and radar charts, test case drill-down, and Best Prompt recommendation.
- **Module 6 (Export):** Full benchmark export in RFC 4180 CSV format and executive Markdown report generation.
- **Containerization & Deployment:** Multi-stage Dockerfile and `start.sh` for Hugging Face Spaces deployment on port 7860.

## [0.9.0] - 2026-11-20
### Added
- Recharts visualizations: comparative grouped bar chart and single-prompt radar profile chart.
- Test case inspection drawer with raw model output displays and Pass/Fail threshold flags (overall >= 7.0).

## [0.8.0] - 2026-11-18
### Added
- Python FastAPI microservice on port 8001.
- Unified `call_llm` driver for Google Gemini Generative AI and Groq Llama 3.x with automatic retries.
- TF-IDF Cosine Similarity matrix calculation for prompt output stability assessment.

## [0.5.0] - 2026-11-15
### Added
- Express backend architecture with JSON flat-file persistence in `data/`.
- Seed test cases covering multi-issue, multilingual, empty, and contradictory customer emails.

## [0.1.0] - 2026-11-10
### Added
- Initial project scaffolding, TypeScript contracts, and Dockerfile design.
