#!/usr/bin/env python3
"""Summarize survey attrition and page-level completion from the private production dump.

Usage:
  python analysis/attrition.py --dump /path/to/prod-dump-2026-08-21.json

The production dump is intentionally not distributed publicly.
"""

from __future__ import annotations
import argparse
import json
from collections import Counter
from pathlib import Path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dump", required=True)
    args = p.parse_args()

    payload = json.loads(Path(args.dump).read_text(encoding="utf-8"))
    sessions = payload["sessions"]

    consented = sum(bool(x["session"].get("consented")) for x in sessions)
    completed = sum(x["session"].get("completed_at") is not None for x in sessions)

    reached_scenario_counts = Counter()
    completed_scenario_counts = Counter()
    post_pages = Counter()

    for row in sessions:
        timing_scenarios = []
        timing_pages = set()
        for t in row.get("timings", []):
            page = t.get("page_id")
            timing_pages.add(page)
            if isinstance(page, str) and page.startswith("scenario:"):
                sid = t.get("scenario_id") or page.split(":", 1)[1]
                if sid not in timing_scenarios:
                    timing_scenarios.append(sid)
        reached_scenario_counts[len(timing_scenarios)] += 1

        answered = {
            a.get("scenario_id")
            for a in row.get("answers", [])
            if a.get("section_id") == "scenario_ratings" and a.get("scenario_id")
        }
        completed_scenario_counts[len(answered)] += 1

        for page in [
            "summary_confidence",
            "term_interpretation",
            "background",
            "final_attribution",
            "general_beliefs",
            "technical_knowledge",
            "demographics",
            "debrief",
        ]:
            if page in timing_pages:
                post_pages[page] += 1

    def at_least(counter: Counter, n: int) -> int:
        return sum(count for k, count in counter.items() if k >= n)

    print(f"Dump sessions: {len(sessions)}")
    print(f"Consented sessions: {consented}")
    print(f"Completed surveys: {completed}")
    print(f"Post-consent completion rate: {completed / consented:.1%}")
    print()
    for n in range(1, 6):
        print(f"Reached scenario position {n}: {at_least(reached_scenario_counts, n)}")
    print(f"Answered all five scenario blocks: {completed_scenario_counts[5]}")
    print()
    for page in [
        "summary_confidence",
        "term_interpretation",
        "background",
        "final_attribution",
        "general_beliefs",
        "technical_knowledge",
        "demographics",
        "debrief",
    ]:
        print(f"Reached {page}: {post_pages[page]}")


if __name__ == "__main__":
    main()
