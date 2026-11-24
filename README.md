# PromptBench — AI Prompt Evaluation Platform

PromptBench is an end-to-end full-stack evaluation workbench designed to help AI engineers and developers systematically optimize, compare, and stress-test LLM prompts across multiple model providers. Users define evaluation benchmarks, author prompt revisions, execute multi-turn consistency runs, and inspect detailed performance analytics across accuracy, relevance, semantic consistency, and deterministic instruction-following.

## 🔗 Repository
- **GitHub Repository:** [https://github.com/adityars07/PromptBench](https://github.com/adityars07/PromptBench)

---

## 👥 Team PromptX
- **Kartikey Pandey** — Roll No: `S24CSEU1344`
- **Aditya** — Roll No: `S24CSEU1357`

---

## 🏗️ System Architecture

PromptBench employs a resilient, polyglot microservice architecture contained within a single unified container for zero-friction deployment:

```
[ User Browser ]
       │
       ▼ (HTTP / Port 7860)
┌──────────────────────────────────────────────────────────┐
│  Node.js + Express Server (TypeScript)                   │
│  - Serves compiled React + Vite SPA                      │
│  - REST API (/api/test-cases, /api/prompts, /api/export) │
│  - Rule-based Instruction-Following Evaluator            │
│  - JSON Flat-File Storage Engine (data/)                 │
└────────────────────────────────────┬─────────────────────┘
                                     │ (HTTP / Port 8001)
                                     ▼
┌──────────────────────────────────────────────────────────┐
│  Python 3.11 FastAPI LLM & Evaluation Service            │
│  - Unified call_llm() wrapper with retries & backoff     │
│  - LLM-as-a-Judge (Accuracy & Relevance at temp 0)       │
│  - Consistency Engine (Scikit-Learn TF-IDF Cosine)       │
│  - Integrations: Google Gemini & Groq (Llama 3.x)        │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- (Optional) `GEMINI_API_KEY` and `GROQ_API_KEY` for live execution

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your API keys (optional; PromptBench includes **Demo Mode** enabled by default):
```env
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
PORT=7860
PYTHON_SERVICE_URL=http://localhost:8001
```

### 2. Install & Start Python LLM Service
```bash
# In project root
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI on port 8001
cd code/llm_service
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Install & Start Backend + Frontend
Open a second terminal:
```bash
# Build Frontend
cd code/client
npm install
npm run build

# Start Backend Server
cd ../server
npm install
npm run build
npm start
```
Navigate to `http://localhost:7860` in your web browser.

---

## 🐳 Docker Deployment

The repository includes a production multi-stage `Dockerfile` and `start.sh` that bundles both the Node backend and Python LLM service into a single container running on port `7860`.

### Run via Docker:
```bash
# 1. Build the Docker image
docker build -t promptbench .

# 2. Run container (demo mode works without keys, or pass keys as env vars)
docker run -p 7860:7860 \
  -e GROQ_API_KEY="your_groq_api_key_optional" \
  -e GEMINI_API_KEY="your_gemini_api_key_optional" \
  promptbench
```
Open `http://localhost:7860` in your browser.

---

## 🧪 10-Line Manual Test Checklist

1. **Service Boot & Healthcheck:** Open `http://localhost:7860/api/health` and verify `status: "healthy"` and `pythonService: "ok"`.
2. **Demo Mode Default Verification:** Verify that the "Demo Mode" toggle in the sidebar is ON by default on initial page load.
3. **Preloaded Dataset Inspection:** Navigate to the "Task & Test Cases" tab and confirm 12 test cases exist (6 Normal, 4 Edge, 2 Invalid).
4. **Prompt Repository Inspection:** Navigate to the "Prompts" tab and verify versions `v1`, `v2`, and `v3` are populated with change notes.
5. **Preloaded Demo Benchmark Load:** Click the "Run Evaluation" tab and press "Load Demo Evaluation Results". Confirm immediate completion.
6. **Results Dashboard & Winner Card:** Verify the "Best Prompt" card displays `v3 - Few-Shot Expert` as the winning prompt.
7. **Dynamic Weight Sliders:** Adjust the "Accuracy" slider in the sidebar and verify that Leaderboard overall scores recompute instantly.
8. **Interactive Visualizations:** Confirm that the Recharts Bar Chart renders all 4 metrics across prompt versions and the Radar Chart updates when toggling prompts.
9. **Test Case Drill-Down:** Expand test case `tc-01` in the drill-down section and inspect individual model outputs, ground truth, and Pass/Fail badges.
10. **Data Export Deliverables:** Click the "Export" tab, download both the CSV and Markdown reports, and verify file integrity.
