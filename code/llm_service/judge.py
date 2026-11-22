"""
Module 4: Evaluator (Python Judge Component)
Handles LLM-as-a-judge prompt evaluation and cross-run consistency calculation.
"""

import json
import re
from typing import List, Dict, Any

JUDGE_SYSTEM_PROMPT = """You are an impartial, highly rigorous AI Benchmark Judge evaluating candidate LLM responses against benchmark ground truth and key criteria.

Evaluate the Candidate Response on two criteria, each on a strict continuous scale from 0.0 to 10.0:

1. ACCURACY (0.0 to 10.0):
   - 10.0: Perfectly factual, matches ground truth, includes all required key points without hallucination or error.
   - 7.0 - 9.0: Substantially accurate, captures main points with minor imprecisions.
   - 4.0 - 6.0: Partially accurate, misses important nuances or contains minor factual discrepancies.
   - 0.0 - 3.0: Factually incorrect, severe hallucinations, or completely contradicts ground truth.

2. RELEVANCE (0.0 to 10.0):
   - 10.0: Directly and concisely addresses the exact task request with zero irrelevant boilerplate.
   - 7.0 - 9.0: Relevant and addresses the problem well with minimal unnecessary text.
   - 4.0 - 6.0: Somewhat relevant but includes significant filler or fails to focus on key incident priorities.
   - 0.0 - 3.0: Off-topic, evades the question, or provides non-responsive text.

RESPONSE FORMAT REQUIREMENTS:
You MUST respond with a strictly valid JSON object ONLY. No conversational text, no markdown code fence blocks (do NOT use ```json).
Format:
{"accuracy": <number 0-10>, "relevance": <number 0-10>, "reasoning": "<one or two concise sentences explaining the scores>"}
"""

def build_judge_prompt(input_text: str, expected_output: str, key_points: List[str], response: str) -> str:
    """Builds the evaluation prompt for the LLM judge."""
    kp_str = "\n".join([f"- {kp}" for kp in (key_points or [])])
    return f"""### BENCHMARK EVALUATION TASK

[ORIGINAL INPUT]:
{input_text}

[EXPECTED GROUND TRUTH]:
{expected_output}

[CRITICAL KEY POINTS TO VERIFY]:
{kp_str if kp_str else "N/A"}

[CANDIDATE RESPONSE TO EVALUATE]:
{response}

Evaluate the candidate response against the ground truth and key points.
Return ONLY the raw JSON object with accuracy, relevance, and reasoning.
"""

def compute_consistency(responses: List[str]) -> Dict[str, Any]:
    """
    Computes semantic similarity across N runs of the same prompt.
    Uses TF-IDF Cosine Similarity with scikit-learn; falls back to token overlap.
    Maps score strictly to 0.0 - 10.0.
    """
    if not responses or len(responses) <= 1:
        return {"score": 10.0, "details": "Single run or identical baseline (default 10.0)"}

    cleaned = [r.strip() for r in responses if r and r.strip()]
    if not cleaned:
        return {"score": 0.0, "details": "All responses were empty"}
    if len(cleaned) < len(responses):
        # penalize runs that failed or returned empty
        penalty = len(cleaned) / len(responses)
    else:
        penalty = 1.0

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np

        vectorizer = TfidfVectorizer(token_pattern=r"(?u)\b\w+\b", lowercase=True)
        tfidf_matrix = vectorizer.fit_transform(cleaned)
        sim_matrix = cosine_similarity(tfidf_matrix)

        # Average pairwise similarity (exclude self-similarity on diagonal)
        n = len(cleaned)
        total_sim = 0.0
        pairs = 0
        for i in range(n):
            for j in range(i + 1, n):
                total_sim += sim_matrix[i, j]
                pairs += 1

        avg_sim = (total_sim / pairs) if pairs > 0 else 1.0
        score = round(float(avg_sim) * 10.0 * penalty, 1)
        return {
            "score": max(0.0, min(10.0, score)),
            "details": f"TF-IDF Cosine across {n} runs: raw={avg_sim:.3f}"
        }

    except Exception as e:
        # Fallback to Jaccard token overlap
        words_list = [set(re.findall(r"\w+", r.lower())) for r in cleaned]
        total_jaccard = 0.0
        pairs = 0
        n = len(words_list)
        for i in range(n):
            for j in range(i + 1, n):
                union = words_list[i].union(words_list[j])
                inter = words_list[i].intersection(words_list[j])
                jaccard = (len(inter) / len(union)) if union else 1.0
                total_jaccard += jaccard
                pairs += 1

        avg_jaccard = (total_jaccard / pairs) if pairs > 0 else 1.0
        score = round(float(avg_jaccard) * 10.0 * penalty, 1)
        return {
            "score": max(0.0, min(10.0, score)),
            "details": f"Token Jaccard fallback across {n} runs: raw={avg_jaccard:.3f}"
        }
