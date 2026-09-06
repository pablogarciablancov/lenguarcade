#!/usr/bin/env python3
import argparse
import copy
import json
import math
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path


GAME_ID = "maniacgrafia"
PLACEHOLDER_NAMES = {
    "alumno",
    "alumno 1",
    "jugador",
    "player",
    "prueba",
    "test",
}
NAME_ALIASES = {
    "glez": ["gonzalez"],
    "guil": ["guillermo"],
    "ingio": ["inigo"],
    "iñgio": ["inigo"],
    "josearia": ["jose", "maria"],
    "josemari": ["jose", "maria"],
    "josemaria": ["jose", "maria"],
    "paco": ["francisco"],
    "pepe": ["jose"],
    "zori": ["zorion"],
}
CUMULATIVE_STATS = {
    "bossesDefeated",
    "bonusCount",
    "bombsUsed",
    "diamondsCaught",
    "emptyBombsTriggered",
    "escobasUsed",
    "feverCount",
    "freezesUsed",
    "gamesPlayed",
    "heartsCaught",
    "itemsBought",
    "livesLost",
    "lootCaught",
    "lupasUsed",
    "premiumCaught",
    "totalWords",
}
MAX_STATS = {
    "adventureWorld",
    "crazyMaxCombo",
    "maxCombo",
}


def chunks(values, size=100):
    for index in range(0, len(values), size):
        yield values[index:index + size]


def integer(value, default=0):
    try:
        number = float(value)
        return default if math.isnan(number) else int(number)
    except (TypeError, ValueError):
        return default


def decimal(value, default=0.0):
    try:
        number = float(value)
        return default if math.isnan(number) else number
    except (TypeError, ValueError):
        return default


def parse_json(value, fallback=None):
    if isinstance(value, (dict, list)):
        return value
    if value in (None, ""):
        return {} if fallback is None else fallback
    try:
        return json.loads(str(value))
    except (TypeError, ValueError, json.JSONDecodeError):
        return {} if fallback is None else fallback


def normalize(value):
    text = unicodedata.normalize("NFKD", str(value or "").lower())
    text = "".join(char for char in text if not unicodedata.combining(char))
    return " ".join(re.sub(r"[^a-z0-9]+", " ", text).split())


def name_tokens(value):
    result = []
    for token in normalize(value).split():
        if token == "jugador":
            continue
        result.extend(NAME_ALIASES.get(token, [token]))
    return result


def class_key(value):
    text = normalize(value)
    if not text:
        return ""
    grade_match = re.search(r"(?:^|[^0-9])([1-4])(?:o)?(?=[^0-9]|$)", text)
    grade = grade_match.group(1) if grade_match else ""
    letter_match = re.search(r"([a-e])\s*$", text)
    letter = ""
    if letter_match and (grade or len(text) == 1 or re.search(r"(?:^|\s)[a-e]\s*$", text)):
        letter = letter_match.group(1).upper()
    if not grade and len(text) == 1 and text in "abcde":
        letter = text.upper()
    return grade + letter


def compatible_class(historical_class, student_classes):
    if not historical_class:
        return False
    if historical_class in student_classes:
        return True
    if len(historical_class) == 1 and historical_class.isdigit():
        return any(value.startswith(historical_class) for value in student_classes)
    if len(historical_class) == 1 and historical_class.isalpha():
        return any(value.endswith(historical_class) for value in student_classes)
    return False


def token_similarity(left, right):
    left_tokens = name_tokens(left)
    right_tokens = name_tokens(right)
    if not left_tokens or not right_tokens:
        return 0.0
    remaining = list(right_tokens)
    scores = []
    for token in left_tokens:
        if not remaining:
            scores.append(0.0)
            continue
        ranked = sorted(
            (
                (
                    max(
                        SequenceMatcher(None, token, candidate).ratio(),
                        0.9
                        if min(len(token), len(candidate)) >= 4
                        and (token.startswith(candidate) or candidate.startswith(token))
                        else 0,
                    ),
                    index,
                )
                for index, candidate in enumerate(remaining)
            ),
            reverse=True,
        )
        score, index = ranked[0]
        scores.append(score)
        remaining.pop(index)
    return sum(scores) / max(len(left_tokens), len(right_tokens))


def name_score(historical_name, classroom_name):
    old = " ".join(name_tokens(historical_name))
    current = " ".join(name_tokens(classroom_name))
    if not old or not current:
        return 0.0
    if old == current:
        return 1.0
    old_tokens = old.split()
    current_tokens = current.split()
    sequence = SequenceMatcher(None, old, current).ratio()
    token_score = token_similarity(old, current)
    first_score = SequenceMatcher(
        None,
        old_tokens[0],
        current_tokens[0],
    ).ratio()
    score = sequence * 0.4 + token_score * 0.4 + first_score * 0.2
    if (
        len(old_tokens) >= 2
        and old_tokens[0] == current_tokens[0]
        and set(old_tokens).issubset(set(current_tokens))
    ):
        score = max(score, 0.96)
    if len(old_tokens) == 1 and old_tokens[0] == current_tokens[0]:
        score = max(score, 0.78)
    return min(1.0, score)


def iso_timestamp(value):
    if not value:
        return None
    text = str(value)
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat()
    except ValueError:
        return text


def latest_timestamp(*values):
    present = [iso_timestamp(value) for value in values if value]
    return max(present) if present else datetime.now(timezone.utc).isoformat()


class SupabaseRest:
    def __init__(self, base_url, secret_key, dry_run=False):
        self.base_url = base_url.rstrip("/")
        self.secret_key = secret_key
        self.dry_run = dry_run

    def request(self, method, path, payload=None, prefer=None):
        if self.dry_run and method not in {"GET", "HEAD"}:
            return []
        body = None
        if payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers = {
            "apikey": self.secret_key,
            "Authorization": f"Bearer {self.secret_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=body,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Supabase respondio HTTP {error.code} en {method} {path}: "
                f"{detail[:1000]}"
            ) from None

    def select(self, table, params=None):
        query = urllib.parse.urlencode(params or {}, safe=",.*()")
        suffix = f"?{query}" if query else ""
        return self.request("GET", f"/rest/v1/{table}{suffix}") or []

    def insert(self, table, rows):
        if not rows:
            return []
        return self.request(
            "POST",
            f"/rest/v1/{table}",
            rows,
            prefer="return=minimal",
        ) or []

    def upsert(self, table, rows, conflict):
        if not rows:
            return []
        query = urllib.parse.urlencode({"on_conflict": conflict}, safe=",")
        return self.request(
            "POST",
            f"/rest/v1/{table}?{query}",
            rows,
            prefer="resolution=merge-duplicates,return=minimal",
        ) or []


def load_export(path):
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not payload.get("ok") or not isinstance(payload.get("rows"), list):
        raise RuntimeError("La exportacion de Maniacgrafia no tiene el formato esperado.")
    rows = []
    for source in payload["rows"]:
        row = dict(source)
        row["progress"] = parse_json(row.get("progressJson"))
        row["studentName"] = str(row.get("studentName") or "").strip()
        row["classGroup"] = str(row.get("classGroup") or "").strip()
        row["updatedAt"] = iso_timestamp(row.get("updatedAt"))
        rows.append(row)
    return rows


def has_meaningful_progress(row):
    return any([
        integer(row.get("totalWords")) > 0,
        integer(row.get("gamesPlayed")) > 0,
        integer(row.get("bestScore")) > 0,
        integer(row.get("achievementsCount")) > 0,
        integer(row.get("coins")) > 0,
        integer(row.get("adventureWorld"), 1) > 1,
        bool(row.get("adventureCompleted")),
    ])


def load_classroom_students(api):
    profiles = api.select("profiles", {
        "select": "id,email,first_name,last_name,source,active",
        "role": "eq.student",
        "source": "eq.classroom",
        "active": "eq.true",
    })
    enrollments = api.select("classroom_enrollments", {
        "select": "profile_id,classroom_id,active",
        "active": "eq.true",
    })
    classrooms = api.select("classrooms", {
        "select": "id,name,section,active,source",
        "active": "eq.true",
    })
    classroom_by_id = {row["id"]: row for row in classrooms}
    classes_by_profile = defaultdict(set)
    for enrollment in enrollments:
        classroom = classroom_by_id.get(enrollment["classroom_id"])
        if not classroom:
            continue
        for label in (classroom.get("section"), classroom.get("name")):
            key = class_key(label)
            if key:
                classes_by_profile[enrollment["profile_id"]].add(key)
    students = []
    for profile in profiles:
        student = dict(profile)
        student["full_name"] = (
            f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
        )
        student["class_keys"] = sorted(classes_by_profile.get(profile["id"], set()))
        students.append(student)
    return students


def rank_candidate(row, student):
    historical_class = class_key(row.get("classGroup"))
    student_classes = set(student.get("class_keys") or [])
    base = name_score(row.get("studentName"), student.get("full_name"))
    same_class = compatible_class(historical_class, student_classes)
    known_full_class = len(historical_class) == 2
    conflicting_class = bool(
        known_full_class
        and any(len(value) == 2 for value in student_classes)
        and not same_class
    )
    score = base + (0.06 if same_class else 0) - (0.16 if conflicting_class else 0)
    return {
        "profile_id": student["id"],
        "name": student["full_name"],
        "email": student.get("email"),
        "classes": student.get("class_keys") or [],
        "base": round(base, 4),
        "score": round(max(0.0, min(1.0, score)), 4),
        "sameClass": same_class,
        "conflictingClass": conflicting_class,
    }


def accept_match(row, ranked, students):
    if not ranked:
        return False, "sin candidatos"
    best = ranked[0]
    second_score = ranked[1]["score"] if len(ranked) > 1 else 0
    margin = best["score"] - second_score
    old_name = " ".join(name_tokens(row.get("studentName")))
    best_name = " ".join(name_tokens(best["name"]))
    old_tokens = old_name.split()
    exact = old_name == best_name
    subset = (
        len(old_tokens) >= 2
        and old_tokens[0] == best_name.split()[0]
        and set(old_tokens).issubset(set(best_name.split()))
    )
    long_subset = (
        len(old_tokens) >= 3
        and set(old_tokens).issubset(set(best_name.split()))
    )
    shared_tokens = set(old_tokens) & set(best_name.split())
    if best["conflictingClass"]:
        return False, "clase incompatible"
    if exact and (best["sameClass"] or margin >= 0.08):
        return True, "nombre exacto"
    if subset and best["sameClass"] and margin >= 0.04:
        return True, "nombre parcial y clase"
    if long_subset and best["sameClass"] and margin >= 0.12:
        return True, "nombre largo parcial y clase"
    if subset and margin >= 0.12:
        return True, "nombre parcial unico"
    if (
        best["sameClass"]
        and old_tokens
        and best_name.split()
        and old_tokens[0] == best_name.split()[0]
        and len(shared_tokens) >= 2
        and margin >= 0.08
    ):
        return True, "nombre abreviado y clase"
    if best["sameClass"] and best["score"] >= 0.82 and margin >= 0.08:
        return True, "nombre aproximado y clase"
    if len(old_tokens) == 1 and best["sameClass"] and old_tokens:
        same_first_and_class = [
            student for student in students
            if name_tokens(student["full_name"])[0] == old_tokens[0]
            and compatible_class(
                class_key(row.get("classGroup")),
                set(student["class_keys"]),
            )
        ]
        if len(same_first_and_class) == 1:
            return True, "nombre unico en clase"
    if len(old_tokens) == 1 and old_tokens and margin >= 0.2:
        same_first = [
            student for student in students
            if name_tokens(student["full_name"])[0] == old_tokens[0]
        ]
        if len(same_first) == 1:
            return True, "nombre unico"
    return False, "coincidencia insuficiente"


def build_matches(rows, students):
    audit_rows = []
    accepted = []
    ignored = []
    for index, row in enumerate(rows):
        normalized_name = normalize(row.get("studentName"))
        if normalized_name in PLACEHOLDER_NAMES or not has_meaningful_progress(row):
            ignored.append(index)
            continue
        ranked = sorted(
            (rank_candidate(row, student) for student in students),
            key=lambda item: (item["score"], item["sameClass"], item["base"]),
            reverse=True,
        )
        is_accepted, reason = accept_match(row, ranked, students)
        best = ranked[0] if ranked else None
        entry = {
            "row": index,
            "profileId": row.get("profileId"),
            "historicalName": row.get("studentName"),
            "historicalClass": row.get("classGroup"),
            "updatedAt": row.get("updatedAt"),
            "accepted": is_accepted,
            "reason": reason,
            "best": best,
            "second": ranked[1] if len(ranked) > 1 else None,
        }
        audit_rows.append(entry)
        if is_accepted:
            accepted.append((row, best["profile_id"]))
    return accepted, audit_rows, ignored


def merge_historical_rows(rows, student):
    ordered = sorted(
        rows,
        key=lambda row: row.get("updatedAt") or "",
    )
    latest = ordered[-1]
    save = copy.deepcopy(latest.get("progress") or {})
    stats = copy.deepcopy(save.get("stats") or {})
    best_scores = copy.deepcopy(stats.get("bestScores") or {})
    unlocked_ids = set()
    for row in ordered:
        progress = row.get("progress") or {}
        source_stats = progress.get("stats") or {}
        unlocked_ids.update(
            str(value) for value in (progress.get("unlockedAchIds") or [])
            if value
        )
        unlocked_ids.update(
            str(value) for value in (row.get("unlockedAchIds") or [])
            if value
        )
        for key in CUMULATIVE_STATS:
            stats[key] = max(integer(stats.get(key)), integer(source_stats.get(key)))
        for key in MAX_STATS:
            stats[key] = max(integer(stats.get(key)), integer(source_stats.get(key)))
        stats["adventureCompleted"] = bool(
            stats.get("adventureCompleted")
            or source_stats.get("adventureCompleted")
            or row.get("adventureCompleted")
        )
        for mode, value in (source_stats.get("bestScores") or {}).items():
            best_scores[mode] = max(integer(best_scores.get(mode)), integer(value))
    stats["bestScores"] = best_scores
    stats["playerName"] = student["full_name"]
    if student.get("class_keys"):
        stats["classGroup"] = student["class_keys"][0]
    save["stats"] = stats
    save["profile"] = {
        "id": student["id"],
        "name": student["full_name"],
        "classGroup": student["class_keys"][0] if student.get("class_keys") else "",
        "studentCode": "",
    }
    save["unlockedAchIds"] = sorted(unlocked_ids)
    save["savedAt"] = latest_timestamp(
        latest.get("updatedAt"),
        save.get("savedAt"),
    )
    summary = copy.deepcopy(save.get("summary") or {})
    summary.update({
        "studentName": student["full_name"],
        "classGroup": save["profile"]["classGroup"],
        "coins": integer(stats.get("coins")),
        "totalWords": integer(stats.get("totalWords")),
        "gamesPlayed": integer(stats.get("gamesPlayed")),
        "maxCombo": integer(stats.get("maxCombo")),
        "adventureWorld": max(1, min(12, integer(stats.get("adventureWorld"), 1))),
        "adventureCompleted": bool(stats.get("adventureCompleted")),
        "achievementsCount": len(unlocked_ids),
        "bestScore": max((integer(value) for value in best_scores.values()), default=0),
    })
    if best_scores:
        summary["bestMode"] = max(
            best_scores,
            key=lambda mode: integer(best_scores[mode]),
        )
    save["summary"] = summary
    return {
        "save": save,
        "stats": stats,
        "unlocked_ids": sorted(unlocked_ids),
        "updated_at": save["savedAt"],
        "source_profiles": sorted({
            str(row.get("profileId") or "") for row in rows if row.get("profileId")
        }),
    }


def historical_progress(merged):
    stats = merged["stats"]
    unlocked = merged["unlocked_ids"]
    world = max(1, min(12, integer(stats.get("adventureWorld"), 1)))
    completed = bool(stats.get("adventureCompleted"))
    words = max(0, integer(stats.get("totalWords")))
    errors = max(0, integer(stats.get("livesLost")))
    games = max(0, integer(stats.get("gamesPlayed")))
    combo = max(0, integer(stats.get("maxCombo")))
    coins = max(0, integer(stats.get("coins")))
    best_score = max(
        (integer(value) for value in (stats.get("bestScores") or {}).values()),
        default=0,
    )
    xp = (
        words * 4
        + len(unlocked) * 20
        + games * 15
        + min(1000, best_score // 25)
        + max(0, world - 1) * 50
        + (250 if completed else 0)
    )
    attempts = words + errors
    accuracy = round(words / attempts * 100, 2) if attempts else 0
    percentage = 100 if completed else round((world - 1) / 11 * 100, 2)
    return {
        "xp": max(0, xp),
        "level": max(1, xp // 500 + 1),
        "percentage": percentage,
        "accuracy": accuracy,
        "attempts": attempts,
        "successes": words,
        "errors": errors,
        "streak": combo,
        "sessions": games,
        "achievements_count": len(unlocked),
        "missions_completed": 0,
        "feathers": min(500, words // 5 + (5 if completed else 0)),
        "coins": coins,
        "best_score": best_score,
        "world": world,
        "completed": completed,
    }


def achievement_catalog(source_path):
    source = Path(source_path).read_text(encoding="utf-8")
    catalog = {}
    category_pattern = re.compile(
        r"\{\s*id:\s*'([^']+)'[^{}]+?"
        r"titles:\s*(\[[^\]]+\])[^{}]+?"
        r"reqs:\s*(\[[^\]]+\])[^{}]+?"
        r"desc:\s*\"([^\"]+)\"",
        re.DOTALL,
    )
    for match in category_pattern.finditer(source):
        category_id, titles_json, reqs_json, description = match.groups()
        titles = json.loads(titles_json)
        requirements = json.loads(reqs_json)
        for index, title in enumerate(titles):
            requirement = requirements[index]
            catalog[f"{category_id}_{index}"] = {
                "title": title,
                "description": description.replace("{r}", str(requirement)),
                "hidden": False,
            }
    absurd_pattern = re.compile(
        r"\{\s*id:\s*'(abs_\d+)'[^{}]+?"
        r"title:\s*'([^']+)'[^{}]+?"
        r"desc:\s*'([^']+)'([^{}]*)\}",
        re.DOTALL,
    )
    for match in absurd_pattern.finditer(source):
        achievement_id, title, description, tail = match.groups()
        catalog[achievement_id] = {
            "title": title,
            "description": description,
            "hidden": "secret: true" in tail,
        }
    return catalog


def merge_with_existing(historical, existing):
    merged = {}
    for key in (
        "xp",
        "level",
        "percentage",
        "accuracy",
        "attempts",
        "successes",
        "errors",
        "streak",
        "sessions",
        "achievements_count",
        "missions_completed",
        "feathers",
    ):
        merged[key] = max(
            decimal(historical.get(key)),
            decimal((existing or {}).get(key)),
        )
    for key in (
        "xp",
        "level",
        "attempts",
        "successes",
        "errors",
        "streak",
        "sessions",
        "achievements_count",
        "missions_completed",
        "feathers",
    ):
        merged[key] = integer(merged[key])
    return merged


def migrate(api, export_path, achievement_source, audit_path, apply_changes=False):
    rows = load_export(export_path)
    students = load_classroom_students(api)
    students_by_id = {student["id"]: student for student in students}
    accepted, audit_rows, ignored = build_matches(rows, students)
    grouped = defaultdict(list)
    for row, profile_id in accepted:
        grouped[profile_id].append(row)

    audit = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "historicalRows": len(rows),
        "classroomStudents": len(students),
        "acceptedRows": len(accepted),
        "matchedStudents": len(grouped),
        "ignoredRows": len(ignored),
        "unmatchedRows": sum(not row["accepted"] for row in audit_rows),
        "matches": audit_rows,
    }
    Path(audit_path).write_text(
        json.dumps(audit, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if not apply_changes:
        return {
            "dryRun": True,
            **{key: audit[key] for key in (
                "historicalRows",
                "classroomStudents",
                "acceptedRows",
                "matchedStudents",
                "ignoredRows",
                "unmatchedRows",
            )},
            "audit": str(audit_path),
        }

    existing_progress = {
        row["profile_id"]: row
        for row in api.select("game_progress", {
            "select": "*",
            "game_id": f"eq.{GAME_ID}",
        })
    }
    existing_saves = {
        row["profile_id"]: row
        for row in api.select("game_saves", {
            "select": "profile_id,revision,save_data,saved_at",
            "game_id": f"eq.{GAME_ID}",
            "slot": "eq.main",
        })
    }
    existing_definitions = {
        row["id"] for row in api.select("achievement_definitions", {
            "select": "id",
            "game_id": f"eq.{GAME_ID}",
        })
    }
    catalog = achievement_catalog(achievement_source)
    progress_rows = []
    save_rows = []
    event_rows = []
    achievement_ids = set()
    player_achievements = []
    preserved_newer_saves = 0
    now = datetime.now(timezone.utc).isoformat()

    for profile_id, historical_rows in grouped.items():
        student = students_by_id[profile_id]
        merged = merge_historical_rows(historical_rows, student)
        calculated = historical_progress(merged)
        existing = existing_progress.get(profile_id)
        progress = merge_with_existing(calculated, existing)
        raw_data = copy.deepcopy((existing or {}).get("raw_data") or {})
        historical_is_newer = (
            not existing
            or latest_timestamp(merged["updated_at"])
            >= latest_timestamp(existing.get("last_activity_at"))
        )
        apply_historical_save = historical_is_newer or not raw_data.get("save")
        if apply_historical_save:
            raw_data["source"] = "maniac-legacy-name-migration-v1"
            raw_data["save"] = merged["save"]
        raw_data["legacyNameMigration"] = {
            "sourceProfiles": merged["source_profiles"],
            "migratedAt": now,
            "historicalUpdatedAt": merged["updated_at"],
            "historicalSaveApplied": apply_historical_save,
        }
        activity_at = latest_timestamp(
            (existing or {}).get("last_activity_at"),
            merged["updated_at"],
        )
        progress_rows.append({
            "profile_id": profile_id,
            "game_id": GAME_ID,
            **progress,
            "raw_data": raw_data,
            "last_activity_at": activity_at,
        })
        old_save = existing_saves.get(profile_id)
        if (
            not old_save
            or latest_timestamp(merged["updated_at"]) >= latest_timestamp(old_save.get("saved_at"))
        ):
            save_rows.append({
                "profile_id": profile_id,
                "game_id": GAME_ID,
                "slot": "main",
                "revision": integer((old_save or {}).get("revision")) + 1,
                "save_data": merged["save"],
                "saved_at": merged["updated_at"],
            })
        else:
            preserved_newer_saves += 1
        historical_xp = integer(calculated["xp"])
        old_xp = integer((existing or {}).get("xp"))
        event_rows.append({
            "result_id": "maniac-legacy-name-migration-v1",
            "profile_id": profile_id,
            "game_id": GAME_ID,
            "event_type": "legacy_name_progress_migrated",
            "xp_delta": max(0, historical_xp - old_xp),
            "feathers_delta": max(
                0,
                integer(calculated["feathers"]) - integer((existing or {}).get("feathers")),
            ),
            "accuracy": calculated["accuracy"],
            "details": {
                "historicalProfiles": len(merged["source_profiles"]),
                "world": calculated["world"],
                "completed": calculated["completed"],
                "words": calculated["successes"],
                "games": calculated["sessions"],
                "achievements": calculated["achievements_count"],
            },
            "occurred_at": activity_at,
        })
        for achievement_id in merged["unlocked_ids"]:
            achievement_ids.add(achievement_id)
            player_achievements.append({
                "profile_id": profile_id,
                "game_id": GAME_ID,
                "achievement_id": achievement_id,
                "unlocked_at": activity_at,
                "details": {"source": "maniac-legacy-name-migration-v1"},
            })

    definitions = []
    for achievement_id in sorted(achievement_ids - existing_definitions):
        definition = catalog.get(achievement_id, {})
        definitions.append({
            "game_id": GAME_ID,
            "id": achievement_id,
            "title": definition.get("title", achievement_id),
            "description": definition.get(
                "description",
                "Logro historico de Maniacgrafia.",
            ),
            "xp_reward": 20,
            "hidden": bool(definition.get("hidden")),
            "metadata": {"source": "maniac-current-catalog"},
        })

    for batch in chunks(definitions):
        api.insert("achievement_definitions", batch)
    for batch in chunks(progress_rows):
        api.upsert("game_progress", batch, "profile_id,game_id")
    for batch in chunks(save_rows):
        api.upsert("game_saves", batch, "profile_id,game_id,slot")
    for batch in chunks(event_rows):
        api.upsert("game_events", batch, "profile_id,game_id,result_id")
    for batch in chunks(player_achievements):
        api.upsert(
            "player_achievements",
            batch,
            "profile_id,game_id,achievement_id",
        )

    return {
        "dryRun": False,
        "historicalRows": len(rows),
        "classroomStudents": len(students),
        "acceptedRows": len(accepted),
        "matchedStudents": len(grouped),
        "ignoredRows": len(ignored),
        "unmatchedRows": audit["unmatchedRows"],
        "progressRows": len(progress_rows),
        "savesWritten": len(save_rows),
        "newerSavesPreserved": preserved_newer_saves,
        "achievementDefinitionsAdded": len(definitions),
        "playerAchievements": len(player_achievements),
        "events": len(event_rows),
        "audit": str(audit_path),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("export")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument(
        "--achievement-source",
        default="games/maniacgrafia/apps-script/Alumno.html",
    )
    parser.add_argument(
        "--audit",
        default=".supabase/maniac-name-match-audit.json",
    )
    args = parser.parse_args()
    url = os.environ.get("SUPABASE_URL", "").strip()
    secret = os.environ.get("SUPABASE_SECRET_KEY", "").strip()
    if not url or not secret:
        raise SystemExit("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY.")
    api = SupabaseRest(url, secret, dry_run=not args.apply)
    result = migrate(
        api,
        args.export,
        args.achievement_source,
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
