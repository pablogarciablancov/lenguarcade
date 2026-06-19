#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.parse

from migrate_maniac_name_progress import SupabaseRest


class SupabaseAdmin(SupabaseRest):
    def delete(self, table, filters, return_rows=False):
        query = urllib.parse.urlencode(filters, safe=".,()*")
        prefer = "return=representation" if return_rows else "return=minimal"
        return self.request("DELETE", f"/rest/v1/{table}?{query}", prefer=prefer) or []


def cleanup(api, apply_changes=False):
    demo_profiles = api.select("profiles", {
        "select": "id,email,role,source,classroom_user_id",
        "role": "eq.student",
        "source": "eq.sheets",
        "classroom_user_id": "is.null",
    })
    demo_classrooms = api.select("classrooms", {
        "select": "id,name,source,classroom_course_id",
        "source": "eq.sheets",
        "classroom_course_id": "is.null",
    })
    summary = {
        "dryRun": not apply_changes,
        "demoStudentProfiles": len(demo_profiles),
        "demoSheetClassrooms": len(demo_classrooms),
    }
    if not apply_changes:
        return summary
    deleted_profiles = api.delete("profiles", {
        "role": "eq.student",
        "source": "eq.sheets",
        "classroom_user_id": "is.null",
    }, return_rows=True)
    deleted_classrooms = api.delete("classrooms", {
        "source": "eq.sheets",
        "classroom_course_id": "is.null",
    }, return_rows=True)
    summary.update({
        "deletedStudentProfiles": len(deleted_profiles),
        "deletedSheetClassrooms": len(deleted_classrooms),
    })
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    url = os.environ.get("SUPABASE_URL", "").strip()
    secret = os.environ.get("SUPABASE_SECRET_KEY", "").strip()
    if not url or not secret:
        raise SystemExit("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY.")
    result = cleanup(SupabaseAdmin(url, secret, dry_run=not args.apply), args.apply)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Error limpiando datos demo: {error}", file=sys.stderr)
        raise
