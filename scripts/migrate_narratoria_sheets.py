#!/usr/bin/env python3
import argparse
import copy
import json
import math
import os
import sys
import urllib.parse
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from migrate_maniac_name_progress import (
    SupabaseRest,
    accept_match,
    build_matches,
    chunks,
    class_key,
    compatible_class,
    integer,
    latest_timestamp,
    load_classroom_students,
    normalize,
    parse_json,
    rank_candidate,
)


GAME_ID = "narratoria"
PLACEHOLDER_NAMES = {"alumno", "alumno 1", "jugador", "pablo garcia"}
PHASE_LABELS = ["Inicio", "Conflicto", "Accion", "Giro", "Final"]
DEFAULT_OBJECTIVES = [
    ["Aparece el protagonista de tu carta", "Aparece el lugar de tu carta"],
    ["Se entiende que quiere conseguir", "Hay una dificultad clara"],
    ["El protagonista realiza una accion importante", "El obstaculo de la carta entra en juego"],
    ["Hay una revelacion o cambio inesperado", "El giro de la carta aparece en la historia"],
    ["Hay una frase o escena de cierre", "Se ve una consecuencia o aprendizaje"],
]


def decimal(value, default=0.0):
    try:
        number = float(value)
        return default if math.isnan(number) else number
    except (TypeError, ValueError):
        return default


def iso(value):
    if not value:
        return None
    return latest_timestamp(value)


def load_export(path):
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not payload.get("ok") or not isinstance(payload.get("stories"), list):
        raise RuntimeError("El export de Narratoria no tiene el formato esperado.")
    return payload


def meaningful_story(row):
    return any([
        integer(row.get("totalWords")) > 0,
        decimal(row.get("finalGrade")) > 0,
        integer(row.get("xp")) > 0,
        bool(row.get("fullText")),
        bool(row.get("stateDataJson")),
    ])


def parse_list(value, fallback=None):
    parsed = parse_json(value, fallback if fallback is not None else [])
    return parsed if isinstance(parsed, list) else (fallback if fallback is not None else [])


def parse_dict(value, fallback=None):
    parsed = parse_json(value, fallback if fallback is not None else {})
    return parsed if isinstance(parsed, dict) else (fallback if fallback is not None else {})


def achievement_ids(row):
    ids = parse_list(row.get("achievementsJson"), [])
    return [str(value) for value in ids if value]


def achievement_titles(row):
    result = {}
    for item in parse_list(row.get("achievementsTitlesJson"), []):
        if isinstance(item, dict) and item.get("id"):
            result[str(item["id"])] = {
                "title": str(item.get("title") or item["id"]),
                "description": str(item.get("description") or ""),
                "hidden": bool(item.get("secret") or item.get("hidden")),
            }
    return result


def story_timestamp(row):
    return latest_timestamp(row.get("completedAt"), row.get("lastSavedAt"), row.get("storyStartedAt"))


def normalize_text_array(values, size=5):
    result = list(values or [])[:size]
    while len(result) < size:
        result.append("")
    return [str(value or "") for value in result]


def normalize_eval_array(values, size=5):
    result = list(values or [])[:size]
    while len(result) < size:
        result.append(None)
    return result


def build_story_save(row, student):
    state_data = parse_dict(row.get("stateDataJson"), {})
    cards = parse_dict(row.get("cardsJson"), state_data.get("cards") or {})
    rarities = parse_dict(row.get("raritiesJson"), state_data.get("rarities") or {})
    texts = parse_list(row.get("phaseTextsJson"), state_data.get("texts") or state_data.get("phaseTexts") or [])
    evaluations = parse_list(row.get("phaseEvaluationsJson"), state_data.get("evaluations") or state_data.get("phaseEvaluations") or [])
    objective_labels = parse_list(row.get("objectiveLabelsJson"), state_data.get("objectiveLabels") or DEFAULT_OBJECTIVES)
    final_report = parse_dict(row.get("finalReportJson"), state_data.get("finalReport") or {})
    achievements = achievement_ids(row) or list(state_data.get("unlockedAchievements") or state_data.get("achievements") or [])
    current_phase = min(4, max(0, integer(row.get("currentPhase"), integer(state_data.get("currentPhase"), 0))))
    if str(row.get("status") or "").lower() == "finalizada":
        current_phase = 4
    return {
        "app": "Narratoria",
        "version": "legacy-sheets-migration-v1",
        "storyId": str(row.get("storyId") or state_data.get("storyId") or ""),
        "sessionId": str(row.get("storyId") or state_data.get("sessionId") or ""),
        "student": {
            "id": student["id"],
            "name": student["full_name"],
            "group": (student.get("class_keys") or [""])[0],
        },
        "difficulty": str(row.get("difficulty") or state_data.get("difficulty") or "cronista"),
        "minWords": integer(row.get("minWords"), integer(state_data.get("minWords"), 50)),
        "mission": str(row.get("mission") or state_data.get("mission") or ""),
        "cards": cards,
        "rarities": rarities,
        "currentPhase": current_phase,
        "currentPhaseName": PHASE_LABELS[current_phase],
        "texts": normalize_text_array(texts),
        "phaseTexts": normalize_text_array(texts),
        "phaseWords": parse_list(row.get("phaseWordsJson"), []),
        "evaluations": normalize_eval_array(evaluations),
        "phaseEvaluations": normalize_eval_array(evaluations),
        "objectiveLabels": objective_labels or DEFAULT_OBJECTIVES,
        "fullText": str(row.get("fullText") or state_data.get("fullText") or ""),
        "totalWords": integer(row.get("totalWords"), integer(state_data.get("totalWords"), 0)),
        "finalGrade": None if row.get("finalGrade") in ("", None) else decimal(row.get("finalGrade")),
        "finalReport": final_report or None,
        "xp": integer(row.get("xp"), integer(state_data.get("xp"), 0)),
        "level": max(1, integer(row.get("level"), integer(state_data.get("level"), 1))),
        "tinteros": integer(row.get("tinteros"), integer(state_data.get("tinteros"), 0)),
        "achievements": achievements,
        "unlockedAchievements": achievements,
        "inventory": parse_dict(row.get("inventoryJson"), state_data.get("inventory") or {"pluma": 0, "pocion": 0}),
        "stats": parse_dict(row.get("statsJson"), state_data.get("stats") or {}),
        "itemUses": parse_dict(row.get("itemUsesJson"), state_data.get("itemUses") or {}),
        "bonusPoints": integer(row.get("bonusPoints"), integer(state_data.get("bonusPoints"), 0)),
        "storyStartedAt": iso(row.get("storyStartedAt")),
        "lastSavedAt": iso(row.get("lastSavedAt")),
        "completedAt": iso(row.get("completedAt")),
        "legacy": {
            "studentKey": row.get("studentKey"),
            "studentName": row.get("studentName"),
            "studentGroup": row.get("studentGroup"),
            "status": row.get("status"),
            "version": row.get("version"),
        },
    }


def objective_points(save):
    total = 0
    for row in save.get("evaluations") or []:
        if isinstance(row, list):
            total += sum(integer(value) for value in row)
    return total


def warnings_from_report(save):
    report = save.get("finalReport") or {}
    spelling = report.get("spelling") if isinstance(report, dict) else {}
    issues = spelling.get("issues") if isinstance(spelling, dict) else []
    total = 0
    for issue in issues or []:
        if isinstance(issue, dict):
            total += max(1, integer(issue.get("count"), 1))
    return total


def progress_from_stories(stories):
    saves = [item["save"] for item in stories]
    final_saves = [save for save in saves if save.get("completedAt")]
    latest = saves[-1]
    total_words = sum(max(0, integer(save.get("totalWords"))) for save in saves)
    total_objective_score = sum(objective_points(save) for save in saves)
    objective_total = max(1, len(saves) * 20)
    final_grades = [decimal(save.get("finalGrade")) for save in final_saves if save.get("finalGrade") not in (None, "")]
    accuracy = round(sum(final_grades) / len(final_grades) * 10, 2) if final_grades else round(total_objective_score / objective_total * 100, 2)
    completed = len(final_saves)
    percentage = 100 if final_saves else min(100, max(0, (integer(latest.get("currentPhase")) + 1) * 20))
    xp = max((integer(save.get("xp")) for save in saves), default=0)
    xp = max(xp, total_words // 2 + total_objective_score * 8 + completed * 80)
    tinteros = max((integer(save.get("tinteros")) for save in saves), default=0)
    achievements = sorted({achievement for save in saves for achievement in save.get("achievements", [])})
    return {
        "xp": xp,
        "level": max(1, xp // 500 + 1),
        "percentage": percentage,
        "accuracy": accuracy,
        "attempts": objective_total,
        "successes": total_objective_score,
        "errors": sum(warnings_from_report(save) for save in saves),
        "streak": max((round(decimal(save.get("finalGrade")) * 10) for save in saves), default=0),
        "sessions": len(saves),
        "achievements_count": len(achievements),
        "missions_completed": completed,
        "feathers": tinteros,
        "last_activity_at": stories[-1]["timestamp"],
        "achievements": achievements,
    }


def build_match_audit(stories, students):
    audit = []
    accepted = []
    ignored = []
    for index, row in enumerate(stories):
        if normalize(row.get("studentName")) in PLACEHOLDER_NAMES or not meaningful_story(row):
            ignored.append(index)
            continue
        match_row = {
            "profileId": row.get("storyId"),
            "studentName": row.get("studentName"),
            "classGroup": row.get("studentGroup"),
            "updatedAt": story_timestamp(row),
        }
        ranked = sorted(
            (rank_candidate(match_row, student) for student in students),
            key=lambda item: (item["score"], item["sameClass"], item["base"]),
            reverse=True,
        )
        ok, reason = accept_match(match_row, ranked, students)
        best = ranked[0] if ranked else None
        audit.append({
            "row": index,
            "storyId": row.get("storyId"),
            "historicalName": row.get("studentName"),
            "historicalClass": row.get("studentGroup"),
            "accepted": ok,
            "reason": reason,
            "best": best,
            "second": ranked[1] if len(ranked) > 1 else None,
        })
        if ok and best:
            accepted.append((row, best["profile_id"]))
    return accepted, audit, ignored


def migrate(api, export_path, audit_path, apply_changes=False):
    payload = load_export(export_path)
    students = load_classroom_students(api)
    students_by_id = {student["id"]: student for student in students}
    accepted, audit_rows, ignored = build_match_audit(payload["stories"], students)
    grouped = defaultdict(list)
    for row, profile_id in accepted:
        grouped[profile_id].append(row)

    audit = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "historicalStories": len(payload["stories"]),
        "classroomStudents": len(students),
        "acceptedStories": len(accepted),
        "matchedStudents": len(grouped),
        "ignoredStories": len(ignored),
        "unmatchedStories": sum(not row["accepted"] for row in audit_rows),
        "matches": audit_rows,
    }
    Path(audit_path).write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    if not apply_changes:
        return {"dryRun": True, **{key: audit[key] for key in audit if key != "matches"}, "audit": audit_path}

    existing_progress = {
        row["profile_id"]: row for row in api.select("game_progress", {
            "select": "*",
            "game_id": f"eq.{GAME_ID}",
        })
    }
    existing_saves = {
        row["profile_id"]: row for row in api.select("game_saves", {
            "select": "profile_id,revision,saved_at,save_data",
            "game_id": f"eq.{GAME_ID}",
            "slot": "eq.main",
        })
    }
    progress_rows = []
    save_rows = []
    event_rows = []
    definitions = {}
    player_achievements = []
    now = datetime.now(timezone.utc).isoformat()

    for profile_id, rows in grouped.items():
        student = students_by_id[profile_id]
        story_items = []
        for row in sorted(rows, key=story_timestamp):
            save = build_story_save(row, student)
            story_items.append({"row": row, "save": save, "timestamp": story_timestamp(row)})
            for achievement_id, definition in achievement_titles(row).items():
                definitions[(GAME_ID, achievement_id)] = {
                    "game_id": GAME_ID,
                    "id": achievement_id,
                    "title": definition["title"],
                    "description": definition["description"],
                    "xp_reward": 20,
                    "hidden": definition["hidden"],
                    "metadata": {"source": "narratoria-legacy-sheets"},
                }
        progress = progress_from_stories(story_items)
        achievements = progress.pop("achievements")
        old = existing_progress.get(profile_id)
        merged = {}
        for key in ("xp", "level", "percentage", "accuracy", "attempts", "successes", "errors", "streak", "sessions", "achievements_count", "missions_completed", "feathers"):
            merged[key] = max(decimal(progress.get(key)), decimal((old or {}).get(key)))
        for key in ("xp", "level", "attempts", "successes", "errors", "streak", "sessions", "achievements_count", "missions_completed", "feathers"):
            merged[key] = integer(merged[key])
        latest_item = story_items[-1]
        archive = [item["save"] for item in story_items]
        save_data = copy.deepcopy(latest_item["save"])
        save_data["storyArchive"] = archive
        raw_data = copy.deepcopy((old or {}).get("raw_data") or {})
        raw_data["source"] = "narratoria-legacy-sheets-migration-v1"
        raw_data["save"] = save_data
        raw_data["legacyNarratoriaMigration"] = {
            "stories": len(archive),
            "migratedAt": now,
            "historicalUpdatedAt": progress["last_activity_at"],
        }
        progress_rows.append({
            "profile_id": profile_id,
            "game_id": GAME_ID,
            **merged,
            "raw_data": raw_data,
            "last_activity_at": latest_timestamp((old or {}).get("last_activity_at"), progress["last_activity_at"]),
        })
        old_save = existing_saves.get(profile_id)
        if not old_save or latest_timestamp(progress["last_activity_at"]) >= latest_timestamp(old_save.get("saved_at")):
            save_rows.append({
                "profile_id": profile_id,
                "game_id": GAME_ID,
                "slot": "main",
                "revision": integer((old_save or {}).get("revision")) + 1,
                "save_data": save_data,
                "saved_at": progress["last_activity_at"],
            })
        event_rows.append({
            "result_id": "narratoria-legacy-sheets-migration-v1",
            "profile_id": profile_id,
            "game_id": GAME_ID,
            "event_type": "legacy_sheets_progress_migrated",
            "xp_delta": max(0, integer(progress["xp"]) - integer((old or {}).get("xp"))),
            "feathers_delta": max(0, integer(progress["feathers"]) - integer((old or {}).get("feathers"))),
            "accuracy": progress["accuracy"],
            "details": {
                "stories": len(archive),
                "completed": progress["missions_completed"],
                "words": sum(integer(item["save"].get("totalWords")) for item in story_items),
                "achievements": len(achievements),
            },
            "occurred_at": progress["last_activity_at"],
        })
        for achievement_id in achievements:
            definitions.setdefault((GAME_ID, achievement_id), {
                "game_id": GAME_ID,
                "id": achievement_id,
                "title": achievement_id,
                "description": "Logro historico de Narratoria.",
                "xp_reward": 20,
                "hidden": False,
                "metadata": {"source": "narratoria-legacy-sheets"},
            })
            player_achievements.append({
                "profile_id": profile_id,
                "game_id": GAME_ID,
                "achievement_id": achievement_id,
                "unlocked_at": progress["last_activity_at"],
                "details": {"source": "narratoria-legacy-sheets-migration-v1"},
            })

    for batch in chunks(list(definitions.values())):
        api.upsert("achievement_definitions", batch, "game_id,id")
    for batch in chunks(progress_rows):
        api.upsert("game_progress", batch, "profile_id,game_id")
    for batch in chunks(save_rows):
        api.upsert("game_saves", batch, "profile_id,game_id,slot")
    for batch in chunks(event_rows):
        api.upsert("game_events", batch, "profile_id,game_id,result_id")
    for batch in chunks(player_achievements):
        api.upsert("player_achievements", batch, "profile_id,game_id,achievement_id")

    return {
        "dryRun": False,
        "historicalStories": len(payload["stories"]),
        "acceptedStories": len(accepted),
        "matchedStudents": len(grouped),
        "ignoredStories": len(ignored),
        "unmatchedStories": audit["unmatchedStories"],
        "progressRows": len(progress_rows),
        "savesWritten": len(save_rows),
        "achievementDefinitions": len(definitions),
        "playerAchievements": len(player_achievements),
        "events": len(event_rows),
        "audit": audit_path,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("export")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--audit", default=".supabase/narratoria-name-match-audit.json")
    args = parser.parse_args()
    url = os.environ.get("SUPABASE_URL", "").strip()
    secret = os.environ.get("SUPABASE_SECRET_KEY", "").strip()
    if not url or not secret:
        raise SystemExit("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY.")
    result = migrate(
        SupabaseRest(url, secret, dry_run=not args.apply),
        args.export,
        args.audit,
        apply_changes=args.apply,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Error de migracion: {error}", file=sys.stderr)
        raise
