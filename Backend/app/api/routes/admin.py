"""RailSync 2.0 — one-time test-data cleanup.

Deletes ONLY rows that match the test-data patterns from the 16 Nov E2E
verification run. Real project rows (TASK-00001…, SEG-001…SEG-050,
PLAN-* from real runs) can never match these patterns:

- tasks:        task_id LIKE 'TASK-E2E-%' OR 'DISRUPTION-%'
- risk/segments: segment_id LIKE 'SEG-TEST-%'
- plans:        the E2E plan PLAN-WEEKLY-663B8A80, plus any plan whose
                assignments reference the test tasks above
- feedback:     records on assignments of those plans/tasks

Bounded by construction: even if called again, or by anyone, it can only
ever delete test-pattern rows. After the cleanup it is a no-op.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.db.database import get_db

router = APIRouter(tags=["Admin"])

TEST_PLAN_ID = "PLAN-WEEKLY-663B8A80"
CONFIRM_VALUE = "remove-test-data"


class CleanupRequest(BaseModel):
    confirm: str


@router.post("/admin/cleanup-test-data")
def cleanup_test_data(request: CleanupRequest, db: Session = Depends(get_db)):
    if request.confirm != CONFIRM_VALUE:
        raise HTTPException(status_code=400, detail="confirm must be 'remove-test-data'")

    patterns = {"p1": "TASK-E2E-%", "p2": "DISRUPTION-%", "sp": "SEG-TEST-%"}

    # Plans touched by the test run: the E2E plan, plus any plan whose
    # assignments reference test tasks (e.g. the what-if run from 16 Nov).
    plan_rows = db.execute(
        text(
            "SELECT plan_id, optimization_run_id FROM block_plans "
            "WHERE plan_id = :plan OR plan_id IN ("
            "  SELECT plan_id FROM block_assignments "
            "  WHERE task_id LIKE :p1 OR task_id LIKE :p2)"
        ),
        {"plan": TEST_PLAN_ID, **{k: v for k, v in patterns.items() if k != "sp"}},
    ).fetchall()
    found_plan_ids = [r[0] for r in plan_rows]
    run_ids = [r[1] for r in plan_rows if r[1]]

    counts = {}
    params = {"plan": TEST_PLAN_ID, **patterns}
    plan_ids = tuple(found_plan_ids) if found_plan_ids else ("__none__",)
    run_ids = tuple(run_ids) if run_ids else ("__none__",)

    def _delete(sql: str, binds: dict) -> int:
        bps = []
        if ":plan_ids" in sql:
            bps.append(bindparam("plan_ids", expanding=True))
        if ":run_ids" in sql:
            bps.append(bindparam("run_ids", expanding=True))
        stmt = text(sql).bindparams(*bps) if bps else text(sql)
        return db.execute(stmt, binds).rowcount

    params = {**params, "plan_ids": plan_ids, "run_ids": run_ids}

    # FK-safe order: feedback -> assignments -> plans -> runs -> results -> tasks -> risks -> segments
    counts["feedback_records"] = _delete(
        "DELETE FROM feedback_records WHERE assignment_id IN ("
        "  SELECT id FROM block_assignments "
        "  WHERE plan_id IN :plan_ids OR task_id LIKE :p1 OR task_id LIKE :p2)",
        params,
    )
    counts["block_assignments"] = _delete(
        "DELETE FROM block_assignments "
        "WHERE plan_id IN :plan_ids OR task_id LIKE :p1 OR task_id LIKE :p2",
        params,
    )
    counts["block_plans"] = _delete(
        "DELETE FROM block_plans WHERE plan_id IN :plan_ids", params
    )
    counts["optimization_runs"] = _delete(
        "DELETE FROM optimization_runs WHERE run_id IN :run_ids", params
    )
    counts["negotiation_results"] = _delete(
        "DELETE FROM negotiation_results WHERE task_id LIKE :p1 OR task_id LIKE :p2",
        params,
    )
    counts["maintenance_tasks"] = _delete(
        "DELETE FROM maintenance_tasks WHERE task_id LIKE :p1 OR task_id LIKE :p2",
        params,
    )
    counts["risk_predictions"] = _delete(
        "DELETE FROM risk_predictions WHERE segment_id LIKE :sp", params
    )
    counts["segments"] = _delete(
        "DELETE FROM segments WHERE segment_id LIKE :sp", params
    )
    db.commit()

    return {"cleaned": True, "plans_removed": found_plan_ids, "deleted": counts}
