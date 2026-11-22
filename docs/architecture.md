# PromptBench Architecture & Technical Specification

## 1. System Overview

PromptBench is built on a decoupled, highly reliable architecture designed to bridge web-scale client interaction with high-throughput AI benchmarking while operating seamlessly within restricted sandbox environments or single-container cloud hosting.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             Web Client (React)                          │
│  - Sidebar: Demo Mode Toggle, Model Selector, Runs/Case, Metric Sliders │
│  - Tabs: Task & Test Cases | Prompts | Run Benchmark | Results | Export │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP (REST)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Node.js + Express Backend Server                     │
│  - Port: 7860                                                           │
│  - Static Asset Delivery: code/client/dist (Vite Build)                 │
│  - REST Endpoints: /api/test-cases, /api/prompts, /api/evaluate, etc.  │
│  - Rule-Based Evaluation: computeInstructionFollowing() (TypeScript)    │
│  - Persistence: JSON flat-file storage in data/                         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP (REST Internal)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Python 3.11 FastAPI LLM Service                     │
│  - Port: 8001                                                           │
│  - Providers: Google Gemini 1.5 Flash, Groq Llama 3.1 8B               │
│  - Resilience: 2 Retries with exponential backoff on all API calls      │
│  - LLM-as-a-Judge: Fixed impartial prompt, Temp 0, JSON enforcement     │
│  - Consistency: Scikit-learn TF-IDF Cosine Similarity across N runs     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Evaluation Pipeline Data Flow

When an evaluation run is initiated:
1. **Combination Matrix Generation:** The runner calculates the Cartesian product:
   $$	ext{Jobs} = 	ext{Prompts} 	imes 	ext{TestCases} 	imes 	ext{Models}$$
2. **Inference Execution:** For each job, the runner issues $N$ consecutive inference calls (default 3, range 1-5) through `POST /llm/generate` to record model latency and outputs.
3. **Consistency Scoring:** The $N$ generated responses are passed to `POST /llm/consistency`, which computes TF-IDF cosine similarity matrices using Scikit-Learn (or Jaccard token overlap fallback) and outputs a normalized $0.0 - 10.0$ score.
4. **LLM-as-a-Judge Scoring:** The primary response is judged against the test case's ground truth and key points via `POST /llm/judge` using a zero-temperature judge model, producing $0.0 - 10.0$ ratings for **Accuracy** and **Relevance**.
5. **Instruction-Following Validation:** The primary response is evaluated by the TypeScript engine for:
   - Strict JSON validity
   - Presence of required schema keys (`issue`, `urgency`, `suggested_action`)
   - Word count limits
   - Language compliance
6. **Weighted Synthesis:** An overall score is computed according to user weightings:
   $$	ext{Overall} = w_{	ext{acc}} \cdot S_{	ext{acc}} + w_{	ext{rel}} \cdot S_{	ext{rel}} + w_{	ext{con}} \cdot S_{	ext{con}} + w_{	ext{if}} \cdot S_{	ext{if}}$$
   If $	ext{Overall} \ge 7.0$, the result is flagged as **PASS**, otherwise **FAIL**.

---

## 3. The Six Core Modules

1. **Test Case Manager (`code/server/testCases.ts`):** Complete CRUD interface and JSON file storage for evaluation cases, preloaded with 12 balanced cases (6 Normal, 4 Edge, 2 Invalid).
2. **Prompt Manager (`code/server/promptManager.ts`):** Version-controlled prompt repository handling templates, temperature parameters, and change histories, initialized from `prompts/v1.txt`, `v2.txt`, and `v3.txt`.
3. **LLM Runner (`code/server/llmRunner.ts` + `code/llm_service/main.py`):** Multi-model runner managing asynchronous execution batches with live progress tracking and exponential backoff retry handlers.
4. **Evaluator (`code/server/evaluator.ts` + `code/llm_service/judge.py`):** Multi-dimensional evaluation engine combining LLM-as-a-judge scoring, Scikit-Learn TF-IDF semantic consistency, and deterministic TypeScript rule checks.
5. **Results Dashboard (`code/client/src/Dashboard.tsx`):** Comprehensive React visualization dashboard featuring real-time weighted leaderboard ranking, Recharts bar and radar charts, and test case drill-down inspection.
6. **Export (`code/server/export.ts`):** Export engine converting benchmarks into RFC 4180 CSV datasets and executive Markdown reports.

---

## 4. Manual Test Checklist (10 Items)

1. Verify server startup logs indicate Express listening on port 7860 and targeting Python service on port 8001.
2. Confirm Demo Mode toggle is enabled by default in the sidebar.
3. Check that the Test Cases tab displays all 12 test cases with appropriate category badges.
4. Verify all 3 default prompt versions (`v1`, `v2`, `v3`) are displayed in the Prompts tab.
5. Execute Demo Evaluation from the Run Evaluation tab and ensure it completes in under 2 seconds.
6. Check that the Results Dashboard leaderboard ranks `v3 - Few-Shot Expert` at the top with a score exceeding 9.0.
7. Adjust the metric weight sliders in the sidebar and verify the Overall scores recalculate dynamically.
8. Verify that the Recharts bar chart shows clear score progression from `v1` to `v3`.
9. Expand a test case in the drill-down section and verify that ground truth and raw model outputs are displayed.
10. Download both CSV and Markdown export files and verify that all evaluated combinations are present.
