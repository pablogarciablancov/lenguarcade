import {
  corsHeaders,
  jsonResponse,
  requireTeacherSession,
} from "../_shared/lenguarcade.ts";

type Row = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

async function getClassroom(admin: any, organizationId: string, classroomId: string) {
  const { data, error } = await admin.from("classrooms")
    .select("id,name,section,legacy_class_code,classroom_course_id,active,source,last_synced_at")
    .eq("organization_id", organizationId)
    .eq("id", classroomId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getStudent(admin: any, organizationId: string, profileId: string) {
  const { data, error } = await admin.from("profiles")
    .select("id,email,first_name,last_name,active,source,last_login_at")
    .eq("organization_id", organizationId)
    .eq("role", "student")
    .eq("id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function revokeSessions(admin: any, profileIds: string[]) {
  if (!profileIds.length) return;
  const { error } = await admin.from("app_sessions")
    .update({ revoked_at:new Date().toISOString() })
    .in("profile_id", profileIds)
    .is("revoked_at", null);
  if (error) throw error;
}

async function listRoster(admin: any, organizationId: string) {
  const [classroomsResult, profilesResult, enrollmentsResult] = await Promise.all([
    admin.from("classrooms")
      .select("id,name,section,legacy_class_code,classroom_course_id,active,source,last_synced_at")
      .eq("organization_id", organizationId)
      .order("active", { ascending:false })
      .order("name"),
    admin.from("profiles")
      .select("id,email,first_name,last_name,active,source,last_login_at")
      .eq("organization_id", organizationId)
      .eq("role", "student")
      .order("active", { ascending:false })
      .order("last_name")
      .order("first_name"),
    admin.from("classroom_enrollments")
      .select("classroom_id,profile_id,active"),
  ]);
  const failure = [classroomsResult.error, profilesResult.error, enrollmentsResult.error].find(Boolean);
  if (failure) throw failure;

  const classrooms: Row[] = classroomsResult.data || [];
  const classroomIds = new Set(classrooms.map(row => row.id));
  const profiles: Row[] = profilesResult.data || [];
  const profileIds = new Set(profiles.map(row => row.id));
  const enrollments: Row[] = (enrollmentsResult.data || []).filter(row =>
    classroomIds.has(row.classroom_id) && profileIds.has(row.profile_id)
  );

  const classroomById = new Map(classrooms.map(row => [row.id, row]));
  const classesByProfile = new Map<string, Row[]>();
  const studentsByClass = new Map<string, Set<string>>();
  for (const enrollment of enrollments) {
    const classroom = classroomById.get(enrollment.classroom_id);
    if (!classroom) continue;
    const list = classesByProfile.get(enrollment.profile_id) || [];
    list.push({ ...classroom, enrollmentActive:enrollment.active !== false });
    classesByProfile.set(enrollment.profile_id, list);
    const members = studentsByClass.get(enrollment.classroom_id) || new Set<string>();
    members.add(enrollment.profile_id);
    studentsByClass.set(enrollment.classroom_id, members);
  }

  const classes = classrooms.map(row => ({
    id:row.id,
    classCode:row.legacy_class_code || row.id,
    name:row.name,
    section:row.section || "",
    active:row.active !== false,
    source:row.source || "",
    classroomCourseId:row.classroom_course_id || "",
    lastSyncedAt:row.last_synced_at || "",
    studentCount:(studentsByClass.get(row.id) || new Set()).size,
  }));

  const students = profiles.map(row => {
    const memberships = (classesByProfile.get(row.id) || []).map(classroom => ({
      id:classroom.id,
      classCode:classroom.legacy_class_code || classroom.id,
      name:classroom.name,
      section:classroom.section || "",
      active:classroom.active !== false,
      enrollmentActive:classroom.enrollmentActive !== false,
    }));
    return {
      id:row.id,
      email:row.email,
      name:`${row.first_name || ""} ${row.last_name || ""}`.trim(),
      firstName:row.first_name || "",
      lastName:row.last_name || "",
      active:row.active !== false,
      source:row.source || "",
      lastLoginAt:row.last_login_at || "",
      classes:memberships,
    };
  });

  return {
    ok:true,
    classes,
    students,
    summary:{
      activeClasses:classes.filter(row => row.active).length,
      archivedClasses:classes.filter(row => !row.active).length,
      activeStudents:students.filter(row => row.active).length,
      archivedStudents:students.filter(row => !row.active).length,
    },
  };
}

async function archiveStudent(admin: any, organizationId: string, profileId: string) {
  const profile = await getStudent(admin, organizationId, profileId);
  if (!profile) return { ok:false, error:"student_not_found" };
  const { error } = await admin.from("profiles")
    .update({ active:false, updated_at:new Date().toISOString() })
    .eq("id", profile.id)
    .eq("organization_id", organizationId)
    .eq("role", "student");
  if (error) throw error;
  await revokeSessions(admin, [profile.id]);
  return { ok:true, action:"archiveStudent", student:{ id:profile.id, email:profile.email } };
}

async function restoreStudent(admin: any, organizationId: string, profileId: string) {
  const profile = await getStudent(admin, organizationId, profileId);
  if (!profile) return { ok:false, error:"student_not_found" };
  const { error } = await admin.from("profiles")
    .update({ active:true, updated_at:new Date().toISOString() })
    .eq("id", profile.id)
    .eq("organization_id", organizationId)
    .eq("role", "student");
  if (error) throw error;
  return { ok:true, action:"restoreStudent", student:{ id:profile.id, email:profile.email } };
}

async function deleteStudent(admin: any, organizationId: string, profileId: string, confirmText: string) {
  if (confirmText !== "ELIMINAR") return { ok:false, error:"confirmation_required" };
  const profile = await getStudent(admin, organizationId, profileId);
  if (!profile) return { ok:false, error:"student_not_found" };
  await revokeSessions(admin, [profile.id]);
  const { error } = await admin.from("profiles")
    .delete()
    .eq("id", profile.id)
    .eq("organization_id", organizationId)
    .eq("role", "student");
  if (error) throw error;
  return { ok:true, action:"deleteStudent", student:{ id:profile.id, email:profile.email } };
}

async function profilesExclusiveToClass(admin: any, organizationId: string, classroomId: string, profileIds: string[]) {
  if (!profileIds.length) return [];
  const { data:orgClasses, error:classesError } = await admin.from("classrooms")
    .select("id,active")
    .eq("organization_id", organizationId)
    .eq("active", true)
    .neq("id", classroomId);
  if (classesError) throw classesError;
  const otherActiveClassIds = (orgClasses || []).map((row: Row) => row.id);
  if (!otherActiveClassIds.length) return profileIds;

  const { data:otherEnrollments, error:enrollmentError } = await admin.from("classroom_enrollments")
    .select("profile_id,classroom_id")
    .in("profile_id", profileIds)
    .in("classroom_id", otherActiveClassIds)
    .eq("active", true);
  if (enrollmentError) throw enrollmentError;
  const kept = new Set((otherEnrollments || []).map((row: Row) => row.profile_id));
  return profileIds.filter(id => !kept.has(id));
}

async function archiveClass(admin: any, organizationId: string, classroomId: string) {
  const classroom = await getClassroom(admin, organizationId, classroomId);
  if (!classroom) return { ok:false, error:"class_not_found" };
  const { data:enrollments, error:enrollmentError } = await admin.from("classroom_enrollments")
    .select("profile_id")
    .eq("classroom_id", classroom.id)
    .eq("active", true);
  if (enrollmentError) throw enrollmentError;
  const profileIds = [...new Set((enrollments || []).map((row: Row) => row.profile_id))];

  const { error } = await admin.from("classrooms")
    .update({ active:false, updated_at:new Date().toISOString() })
    .eq("id", classroom.id)
    .eq("organization_id", organizationId);
  if (error) throw error;

  const exclusiveIds = await profilesExclusiveToClass(admin, organizationId, classroom.id, profileIds);
  if (exclusiveIds.length) {
    const { error:profilesError } = await admin.from("profiles")
      .update({ active:false, updated_at:new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("role", "student")
      .in("id", exclusiveIds);
    if (profilesError) throw profilesError;
    await revokeSessions(admin, exclusiveIds);
  }
  return {
    ok:true,
    action:"archiveClass",
    classroom:{ id:classroom.id, name:classroom.name, classCode:classroom.legacy_class_code || classroom.id },
    archivedStudents:exclusiveIds.length,
  };
}

async function restoreClass(admin: any, organizationId: string, classroomId: string) {
  const classroom = await getClassroom(admin, organizationId, classroomId);
  if (!classroom) return { ok:false, error:"class_not_found" };

  const { error } = await admin.from("classrooms")
    .update({ active:true, updated_at:new Date().toISOString() })
    .eq("id", classroom.id)
    .eq("organization_id", organizationId);
  if (error) throw error;

  const { data:enrollments, error:enrollmentError } = await admin.from("classroom_enrollments")
    .select("profile_id")
    .eq("classroom_id", classroom.id)
    .eq("active", true);
  if (enrollmentError) throw enrollmentError;
  const profileIds = [...new Set((enrollments || []).map((row: Row) => row.profile_id))];
  if (profileIds.length) {
    const { error:profilesError } = await admin.from("profiles")
      .update({ active:true, updated_at:new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("role", "student")
      .in("id", profileIds);
    if (profilesError) throw profilesError;
  }
  return {
    ok:true,
    action:"restoreClass",
    classroom:{ id:classroom.id, name:classroom.name, classCode:classroom.legacy_class_code || classroom.id },
    restoredStudents:profileIds.length,
  };
}

async function deleteClass(admin: any, organizationId: string, classroomId: string, confirmText: string) {
  if (confirmText !== "ELIMINAR") return { ok:false, error:"confirmation_required" };
  const classroom = await getClassroom(admin, organizationId, classroomId);
  if (!classroom) return { ok:false, error:"class_not_found" };

  const { data:targetEnrollments, error:targetError } = await admin.from("classroom_enrollments")
    .select("profile_id")
    .eq("classroom_id", classroom.id);
  if (targetError) throw targetError;
  const profileIds = [...new Set((targetEnrollments || []).map((row: Row) => row.profile_id))];

  let orphanIds: string[] = [];
  if (profileIds.length) {
    const { data:otherEnrollments, error:otherError } = await admin.from("classroom_enrollments")
      .select("profile_id,classroom_id")
      .in("profile_id", profileIds)
      .neq("classroom_id", classroom.id);
    if (otherError) throw otherError;
    const withOtherClass = new Set((otherEnrollments || []).map((row: Row) => row.profile_id));
    orphanIds = profileIds.filter(id => !withOtherClass.has(id));
  }

  const { error:classError } = await admin.from("classrooms")
    .delete()
    .eq("id", classroom.id)
    .eq("organization_id", organizationId);
  if (classError) throw classError;

  if (orphanIds.length) {
    await revokeSessions(admin, orphanIds);
    const { error:profileError } = await admin.from("profiles")
      .delete()
      .eq("organization_id", organizationId)
      .eq("role", "student")
      .in("id", orphanIds);
    if (profileError) throw profileError;
  }

  return {
    ok:true,
    action:"deleteClass",
    classroom:{ id:classroom.id, name:classroom.name, classCode:classroom.legacy_class_code || classroom.id },
    deletedStudents:orphanIds.length,
    preservedStudents:profileIds.length - orphanIds.length,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, organizationId } = await requireTeacherSession(request);
    const body = await request.json().catch(() => ({}));
    const action = clean(body.action || "list");
    const targetId = clean(body.targetId);
    const confirmText = clean(body.confirmText);

    let result;
    if (action === "list") result = await listRoster(admin, organizationId);
    else if (action === "archiveStudent") result = await archiveStudent(admin, organizationId, targetId);
    else if (action === "restoreStudent") result = await restoreStudent(admin, organizationId, targetId);
    else if (action === "deleteStudent") result = await deleteStudent(admin, organizationId, targetId, confirmText);
    else if (action === "archiveClass") result = await archiveClass(admin, organizationId, targetId);
    else if (action === "restoreClass") result = await restoreClass(admin, organizationId, targetId);
    else if (action === "deleteClass") result = await deleteClass(admin, organizationId, targetId, confirmText);
    else return jsonResponse({ ok:false, error:"unknown_action" }, 400);

    if (result?.ok === false) {
      const status = result.error === "confirmation_required" ? 400 : 404;
      return jsonResponse(result, status);
    }
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("teacher-roster-management failed", error);
    return jsonResponse({ ok:false, error:"roster_management_unavailable" }, 503);
  }
});
