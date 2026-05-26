"""
Human Eval Results Analyzer
Usage:
    python scripts/analyze.py
    python scripts/analyze.py --out results/output.csv

Requires:
    pip install supabase python-dotenv
"""
import os
import math
import csv
import argparse
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.local"))

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

CONDITION_LABELS = {
    "rankshap": "RankSHAP",
    "chunkgroupshap": "ChunkGroupSHAP",
    "chunkgroupshap_random": "ChunkGroupSHAP w/ Random Grouping",
}


# ---------- metrics ----------

def dcg(rels: list[float], k: int = 5) -> float:
    return sum(r / math.log2(i + 2) for i, r in enumerate(rels[:k]))


def ndcg5(submitted_order: list[str], judgments: list[dict] | None) -> float | None:
    rel_dict: dict[str, float] = {}
    if judgments:
        for j in judgments:
            rel_dict[j["doc_id"]] = float(j["relevance"])

    submitted_rels = [rel_dict.get(doc_id, 0.0) for doc_id in submitted_order[:5]]
    ideal_rels = sorted(rel_dict.values(), reverse=True)[:5]

    idcg = dcg(ideal_rels)
    if idcg == 0:
        return None  # no relevant docs
    return dcg(submitted_rels) / idcg


def mean(vals: list[float]) -> float | None:
    return sum(vals) / len(vals) if vals else None


def std(vals: list[float]) -> float | None:
    if len(vals) < 2:
        return 0.0
    m = mean(vals)
    return math.sqrt(sum((x - m) ** 2 for x in vals) / (len(vals) - 1))


# ---------- fetch ----------

def fetch_responses() -> list[dict]:
    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = (
        client.table("eval_responses")
        .select(
            "id, session_id, email, task_index, condition, query_id, "
            "judgments, submitted_order, target_order, elapsed_ms, "
            "started_at, submitted_at"
        )
        .order("submitted_at")
        .execute()
    )
    return result.data or []


# ---------- compute ----------

def compute(rows: list[dict]) -> tuple[list[dict], list[dict]]:
    per_response = []
    for row in rows:
        score = ndcg5(row["submitted_order"], row["judgments"])
        per_response.append({
            **row,
            "ndcg5": score,
            "elapsed_s": row["elapsed_ms"] / 1000,
        })

    conditions = ["rankshap", "chunkgroupshap", "chunkgroupshap_random"]
    summary = []
    for cond in conditions:
        group = [r for r in per_response if r["condition"] == cond]
        ndcg_vals = [r["ndcg5"] for r in group if r["ndcg5"] is not None]
        time_vals = [r["elapsed_s"] for r in group]
        summary.append({
            "condition": cond,
            "label": CONDITION_LABELS.get(cond, cond),
            "n": len(group),
            "ndcg5_mean": mean(ndcg_vals),
            "ndcg5_std": std(ndcg_vals),
            "elapsed_s_mean": mean(time_vals),
            "elapsed_s_std": std(time_vals),
        })

    return per_response, summary


# ---------- output ----------

def fmt(v, digits=4):
    return f"{v:.{digits}f}" if v is not None else ""


def print_summary(summary: list[dict]) -> None:
    print("\n=== SUMMARY ===")
    header = f"{'Condition':<40} {'N':>5} {'NDCG@5':>8} {'±':>8} {'Time(s)':>8} {'±':>8}"
    print(header)
    print("-" * len(header))
    for s in summary:
        print(
            f"{s['label']:<40} {s['n']:>5} "
            f"{fmt(s['ndcg5_mean']):>8} {fmt(s['ndcg5_std']):>8} "
            f"{fmt(s['elapsed_s_mean'], 1):>8} {fmt(s['elapsed_s_std'], 1):>8}"
        )


def save_csv(per_response: list[dict], summary: list[dict], path: str) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    with open(path, "w", newline="") as f:
        w = csv.writer(f)

        # Summary sheet
        w.writerow(["=== SUMMARY ==="])
        w.writerow(["condition", "label", "n", "ndcg5_mean", "ndcg5_std",
                    "elapsed_s_mean", "elapsed_s_std"])
        for s in summary:
            w.writerow([
                s["condition"], s["label"], s["n"],
                fmt(s["ndcg5_mean"]), fmt(s["ndcg5_std"]),
                fmt(s["elapsed_s_mean"], 2), fmt(s["elapsed_s_std"], 2),
            ])

        w.writerow([])

        # Detail sheet
        w.writerow(["=== DETAIL ==="])
        w.writerow(["session_id", "email", "task_index", "condition", "query_id",
                    "ndcg5", "elapsed_s", "started_at", "submitted_at"])
        for r in per_response:
            w.writerow([
                r["session_id"], r["email"], r["task_index"],
                r["condition"], r["query_id"],
                fmt(r["ndcg5"]), fmt(r["elapsed_s"], 2),
                r.get("started_at", ""), r["submitted_at"],
            ])

    print(f"\nSaved → {path}")


# ---------- main ----------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=f"results/human_eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
    args = parser.parse_args()

    print("Fetching responses from Supabase…")
    rows = fetch_responses()
    print(f"Fetched {len(rows)} responses.")

    per_response, summary = compute(rows)
    print_summary(summary)
    save_csv(per_response, summary, args.out)


if __name__ == "__main__":
    main()
