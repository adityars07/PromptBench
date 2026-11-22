"""
LLM Runner & Service Backend
FastAPI server providing unified access to Gemini and Groq with retries,
temperature control, LLM-as-a-judge scoring, and consistency analysis.
"""

import os
import time
import json
import re
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from judge import JUDGE_SYSTEM_PROMPT, build_judge_prompt, compute_consistency

load_dotenv()

app = FastAPI(title="PromptBench LLM Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Configure Gemini client if key is set
genai_client = None
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        genai_client = genai
    except Exception as e:
        print(f"[Warning] Failed to initialize Gemini client: {e}")

# Configure Groq client if key is set
groq_client = None
if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"[Warning] Failed to initialize Groq client: {e}")


class GenerateRequest(BaseModel):
    provider: str = Field(..., description="'google' or 'groq'")
    model: str = Field(..., description="Model identifier e.g. gemini-1.5-flash or llama-3.1-8b-instant")
    system_prompt: str = ""
    user_prompt: str
    temperature: float = 0.7

class GenerateResponse(BaseModel):
    text: str
    latency_ms: int
    provider: str
    model: str

class JudgeRequest(BaseModel):
    input_text: str
    expected_output: str = ""
    key_points: List[str] = []
    response: str

class JudgeResponse(BaseModel):
    accuracy: float
    relevance: float
    reasoning: str

class ConsistencyRequest(BaseModel):
    responses: List[str]

class ConsistencyResponse(BaseModel):
    score: float
    details: str


async def call_llm(provider: str, model: str, system_prompt: str, user_prompt: str, temperature: float, retries: int = 2) -> str:
    """
    Unified LLM call supporting Google Gemini and Groq Llama with exponential backoff retries.
    """
    last_error = None
    for attempt in range(retries + 1):
        try:
            if provider.lower() == "google":
                if not genai_client:
                    raise ValueError("GEMINI_API_KEY is not configured on the server")
                
                # Gemini model setup
                def _gemini_call():
                    gen_config = genai_client.types.GenerationConfig(
                        temperature=max(0.0, min(1.0, temperature))
                    )
                    gm = genai_client.GenerativeModel(
                        model_name=model if model else "gemini-1.5-flash",
                        system_instruction=system_prompt if system_prompt else None,
                        generation_config=gen_config
                    )
                    resp = gm.generate_content(user_prompt)
                    return resp.text if resp and resp.text else ""

                return await asyncio.to_thread(_gemini_call)

            elif provider.lower() == "groq":
                if not groq_client:
                    raise ValueError("GROQ_API_KEY is not configured on the server")

                def _groq_call():
                    messages = []
                    if system_prompt:
                        messages.append({"role": "system", "content": system_prompt})
                    messages.append({"role": "user", "content": user_prompt})

                    completion = groq_client.chat.completions.create(
                        model=model if model else "llama-3.1-8b-instant",
                        messages=messages,
                        temperature=max(0.0, min(1.5, temperature))
                    )
                    return completion.choices[0].message.content or ""

                return await asyncio.to_thread(_groq_call)

            else:
                raise ValueError(f"Unsupported LLM provider: {provider}")

        except Exception as e:
            last_error = e
            print(f"[Attempt {attempt+1}/{retries+1}] Error calling {provider}/{model}: {e}")
            if attempt < retries:
                await asyncio.sleep(1.0 * (2 ** attempt))

    raise HTTPException(status_code=502, detail=f"LLM call failed after {retries+1} attempts: {str(last_error)}")


@app.get("/health")
def health_check():
    """Returns service health and provider configuration status."""
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY and genai_client),
        "groq_configured": bool(GROQ_API_KEY and groq_client),
        "service": "PromptBench Python LLM Service",
        "port": 8001
    }


@app.get("/judge-prompt")
def get_judge_prompt():
    """Returns the exact system prompt used by the LLM-as-a-judge."""
    return {"system_prompt": JUDGE_SYSTEM_PROMPT}


@app.post("/llm/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """Executes single LLM inference and records latency in milliseconds."""
    start = time.perf_counter()
    try:
        text = await call_llm(
            provider=req.provider,
            model=req.model,
            system_prompt=req.system_prompt,
            user_prompt=req.user_prompt,
            temperature=req.temperature
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    latency = int((time.perf_counter() - start) * 1000)
    return GenerateResponse(
        text=text,
        latency_ms=latency,
        provider=req.provider,
        model=req.model
    )


@app.post("/llm/judge", response_model=JudgeResponse)
async def judge_candidate(req: JudgeRequest):
    """
    Scores candidate response using LLM-as-a-judge with zero temperature.
    Falls back gracefully if LLM is unavailable or JSON parsing fails.
    """
    judge_prompt = build_judge_prompt(
        input_text=req.input_text,
        expected_output=req.expected_output,
        key_points=req.key_points,
        response=req.response
    )

    # Determine provider for judge: prefer Google, then Groq
    provider = "google" if (GEMINI_API_KEY and genai_client) else ("groq" if (GROQ_API_KEY and groq_client) else None)
    model = "gemini-1.5-flash" if provider == "google" else "llama-3.1-8b-instant"

    if not provider:
        # Heuristic fallback if no API keys are configured
        resp_lower = req.response.lower()
        matched_kp = sum(1 for kp in req.key_points if kp.lower() in resp_lower) if req.key_points else 1
        total_kp = len(req.key_points) if req.key_points else 1
        ratio = matched_kp / total_kp
        return JudgeResponse(
            accuracy=round(5.0 + (ratio * 4.0), 1),
            relevance=round(6.0 + (ratio * 3.0), 1),
            reasoning=f"Heuristic scoring (No LLM keys configured): matched {matched_kp}/{total_kp} key points."
        )

    try:
        judge_output = await call_llm(
            provider=provider,
            model=model,
            system_prompt=JUDGE_SYSTEM_PROMPT,
            user_prompt=judge_prompt,
            temperature=0.0
        )

        # Parse JSON from judge response
        clean_text = judge_output.strip()
        if clean_text.startswith("```"):
            clean_text = re.sub(r"^```(?:json)?|```$", "", clean_text, flags=re.MULTILINE).strip()

        match = re.search(r"\{.*\}", clean_text, re.DOTALL)
        if match:
            clean_text = match.group(0)

        data = json.loads(clean_text)
        acc = float(data.get("accuracy", 6.0))
        rel = float(data.get("relevance", 6.0))
        reasoning = str(data.get("reasoning", "LLM Judge evaluation completed."))
        return JudgeResponse(
            accuracy=max(0.0, min(10.0, round(acc, 1))),
            relevance=max(0.0, min(10.0, round(rel, 1))),
            reasoning=reasoning
        )
    except Exception as e:
        print(f"[Judge Error] {e}. Falling back to default baseline.")
        return JudgeResponse(
            accuracy=5.0,
            relevance=5.0,
            reasoning=f"Judge failed to parse JSON output. Fallback applied: {str(e)[:100]}"
        )


@app.post("/llm/consistency", response_model=ConsistencyResponse)
def evaluate_consistency(req: ConsistencyRequest):
    """Computes semantic consistency score across multiple runs using TF-IDF / Token similarity."""
    result = compute_consistency(req.responses)
    return ConsistencyResponse(score=result["score"], details=result["details"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
