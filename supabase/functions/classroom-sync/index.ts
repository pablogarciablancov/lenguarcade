import {
  corsHeaders,
  jsonResponse,
  requireTeacherSession,
} from "../_shared/lenguarcade.ts";

function cleanText(value: unknown, max = 250) {
  return String(value || "").trim().slice(0, max);
}

function randomPin() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

function gradeFor(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return 0;
  const attempts = rows.reduce((sum, row) => sum + Number(row.attempts || 0), 0);
  const successes = rows.reduce((sum, row) => sum + Number(row.successes || 0), 0);
  const xp = rows.reduce((sum, row) => sum + Number(row.xp || 0), 0);
  const accuracy = attempts ? (successes / attempts) * 100 : 0;
  const sessions = rows.reduce((sum, row) => sum + Number(row.sessions || 0), 0);
  const variety = rows.filter(row => Number(row.sessions || 0) > 0).length;
  const score =
    Math.min(10, xp / Math.max(1, rows.length) / 80) * 0.35 +
    Math.min(10, accuracy / 10) * 0.35 +
    Math.min(10, sessions * 1.2) * 0.15 +
    Math.min(10, variety * 1.7) * 0.15;
  return Math.round(score * 10) / 10;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const {
      admin,
      organizationId,
      profileId:teacherProfileId,
    } = await requireTeacherSession(request);
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "verify");
    if (action === "verify") return jsonResponse({ ok:true });

    if (action === "grade-export") {
      const { data:teacherLinks, error:linksError } = await admin
        .from("classroom_teachers")
        .select("classroom_id,classrooms(id,name,classroom_course_id)")
        .eq("profile_id", teacherProfileId);
      if (linksError) throw linksError;
      const classroomIds = (teacherLinks || []).map(row => row.classroom_id);
      if (!classroomIds.length) return jsonResponse({ ok:true, courses:[] });
      const [
        enrollmentsResult,
        profilesResult,
        progressResult,
      ] = await Promise.all([
        admin.from("classroom_enrollments")
          .select("classroom_id,profile_id")
          .in("classroom_id", classroomIds)
          .eq("active", true),
        admin.from("profiles")
          .select("id,email,first_name,last_name,classroom_user_id")
          .eq("organization_id", organizationId)
          .eq("role", "student")
          .eq("active", true),
        admin.from("game_progress")
          .select("profile_id,xp,attempts,successes,sessions"),
      ]);
      const failure = [
        enrollmentsResult.error,
        profilesResult.error,
        progressResult.error,
      ].find(Boolean);
      if (failure) throw failure;
      const profileById = new Map((profilesResult.data || []).map(row => [row.id, row]));
      const progressByProfile = new Map<string, Array<Record<string, unknown>>>();
      for (const row of progressResult.data || []) {
        const values = progressByProfile.get(row.profile_id) || [];
        values.push(row);
        progressByProfile.set(row.profile_id, values);
      }
      const courses = (teacherLinks || []).map(link => {
        const relation = link.classrooms;
        const classroom = Array.isArray(relation) ? relation[0] : relation;
        const students = (enrollmentsResult.data || [])
          .filter(row => row.classroom_id === link.classroom_id)
          .map(row => profileById.get(row.profile_id))
          .filter(Boolean)
          .filter(profile => profile!.classroom_user_id)
          .map(profile => ({
            profileId:profile!.id,
            classroomUserId:profile!.classroom_user_id,
            email:profile!.email,
            name:`${profile!.first_name} ${profile!.last_name}`.trim(),
            score:gradeFor(progressByProfile.get(profile!.id) || []),
          }));
        return {
          classroomId:link.classroom_id,
          classroomCourseId:classroom?.classroom_course_id || "",
          name:classroom?.name || "",
          students,
        };
      }).filter(course => course.classroomCourseId);
      return jsonResponse({ ok:true, courses });
    }

    if (action !== "sync") return jsonResponse({ ok:false, error:"unknown_action" }, 400);
    const snapshot = body.snapshot && typeof body.snapshot === "object" ? body.snapshot : {};
    const courses = Array.isArray(snapshot.courses) ? snapshot.courses.slice(0, 100) : [];
    const { data:syncRun, error:runError } = await admin.from("classroom_sync_runs")
      .insert({
        organization_id:organizationId,
        requested_by:teacherProfileId,
        sync_type:"classroom_roster",
        status:"processing",
      })
      .select("id")
      .single();
    if (runError) throw runError;

    const { data:existingProfiles, error:profilesError } = await admin.from("profiles")
      .select("id,email,classroom_user_id")
      .eq("organization_id", organizationId);
    if (profilesError) throw profilesError;
    const profileByEmail = new Map(
      (existingProfiles || []).map(row => [String(row.email).toLowerCase(), row])
    );
    const { data:existingClassrooms, error:classroomsError } = await admin.from("classrooms")
      .select("id,name,legacy_class_code,classroom_course_id")
      .eq("organization_id", organizationId);
    if (classroomsError) throw classroomsError;

    let studentsSeen = 0;
    let recordsChanged = 0;
    const newCredentials: Array<{ email:string; pin:string }> = [];
    for (const courseInput of courses) {
      const courseId = cleanText(courseInput.id, 100);
      const name = cleanText(courseInput.name);
      if (!courseId || !name) continue;
      const section = cleanText(courseInput.section);
      let classroom = (existingClassrooms || []).find(row =>
        row.classroom_course_id === courseId ||
        (!row.classroom_course_id && (
          row.name.toLowerCase() === name.toLowerCase() ||
          String(row.legacy_class_code || "").toLowerCase() === name.toLowerCase()
        ))
      );
      if (classroom) {
        const { error } = await admin.from("classrooms").update({
          classroom_course_id:courseId,
          name,
          section,
          course_state:cleanText(courseInput.courseState, 30) || "ACTIVE",
          alternate_link:cleanText(courseInput.alternateLink, 500),
          active:true,
          source:"classroom",
          last_synced_at:new Date().toISOString(),
        }).eq("id", classroom.id);
        if (error) throw error;
      } else {
        const { data:created, error } = await admin.from("classrooms").insert({
          organization_id:organizationId,
          classroom_course_id:courseId,
          name,
          section,
          course_state:cleanText(courseInput.courseState, 30) || "ACTIVE",
          alternate_link:cleanText(courseInput.alternateLink, 500),
          active:true,
          source:"classroom",
          last_synced_at:new Date().toISOString(),
        }).select("id,name,legacy_class_code,classroom_course_id").single();
        if (error) throw error;
        classroom = created;
        existingClassrooms?.push(created);
      }
      await admin.from("classroom_teachers").upsert({
        classroom_id:classroom.id,
        profile_id:teacherProfileId,
        is_owner:true,
      }, { onConflict:"classroom_id,profile_id" });

      const activeProfileIds = new Set<string>();
      const students = Array.isArray(courseInput.students)
        ? courseInput.students.slice(0, 1000)
        : [];
      for (const student of students) {
        const email = cleanText(student.email).toLowerCase();
        if (!email || !email.includes("@")) continue;
        studentsSeen += 1;
        let profile = profileByEmail.get(email);
        if (profile) {
          const { error } = await admin.from("profiles").update({
            first_name:cleanText(student.firstName),
            last_name:cleanText(student.lastName),
            classroom_user_id:cleanText(student.classroomUserId, 100) || profile.classroom_user_id,
            active:true,
            source:profile.classroom_user_id ? "classroom" : "sheets+classroom",
          }).eq("id", profile.id);
          if (error) throw error;
        } else {
          const { data:created, error } = await admin.from("profiles").insert({
            organization_id:organizationId,
            classroom_user_id:cleanText(student.classroomUserId, 100) || null,
            email,
            first_name:cleanText(student.firstName),
            last_name:cleanText(student.lastName),
            role:"student",
            active:true,
            source:"classroom",
          }).select("id,email,classroom_user_id").single();
          if (error) throw error;
          profile = created;
          profileByEmail.set(email, created);
          const pin = randomPin();
          const { error:pinError } = await admin.rpc("set_profile_pin", {
            target_profile_id:created.id,
            plain_pin:pin,
          });
          if (pinError) throw pinError;
          newCredentials.push({ email, pin });
        }
        activeProfileIds.add(profile.id);
        const { error:enrollmentError } = await admin.from("classroom_enrollments").upsert({
          classroom_id:classroom.id,
          profile_id:profile.id,
          active:true,
        }, { onConflict:"classroom_id,profile_id" });
        if (enrollmentError) throw enrollmentError;
        recordsChanged += 1;
      }

      const { data:oldEnrollments, error:oldError } = await admin
        .from("classroom_enrollments")
        .select("profile_id")
        .eq("classroom_id", classroom.id)
        .eq("active", true);
      if (oldError) throw oldError;
      const staleIds = (oldEnrollments || [])
        .map(row => row.profile_id)
        .filter(profileId => !activeProfileIds.has(profileId));
      if (staleIds.length) {
        const { error } = await admin.from("classroom_enrollments")
          .update({ active:false })
          .eq("classroom_id", classroom.id)
          .in("profile_id", staleIds);
        if (error) throw error;
      }
    }

    await admin.from("classroom_sync_runs").update({
      status:"completed",
      courses_seen:courses.length,
      students_seen:studentsSeen,
      records_changed:recordsChanged,
      details:{ newStudents:newCredentials.length },
      finished_at:new Date().toISOString(),
    }).eq("id", syncRun.id);
    return jsonResponse({
      ok:true,
      coursesSeen:courses.length,
      studentsSeen,
      recordsChanged,
      newCredentials,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("classroom-sync failed", error);
    return jsonResponse({ ok:false, error:"classroom_sync_unavailable" }, 503);
  }
});
