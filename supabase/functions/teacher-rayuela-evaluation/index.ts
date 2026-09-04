import {
  boundedNumber,
  corsHeaders,
  jsonResponse,
  requireTeacherSession,
} from "../_shared/lenguarcade.ts";

type Criterion = {
  id:string;
  label:string;
  weight:number;
  score:number;
  comment:string;
};

type NodeComment = {
  id:string;
  nodeId:string;
  comment:string;
};

function cleanText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanCriteria(value: unknown): Criterion[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((item: Record<string, unknown>, index) => ({
    id:cleanText(item?.id || `criterion_${index + 1}`, 80),
    label:cleanText(item?.label || `Criterio ${index + 1}`, 180),
    weight:boundedNumber(item?.weight, 0, 100, 0),
    score:boundedNumber(item?.score, 0, 10, 0),
    comment:cleanText(item?.comment, 1000),
  })).filter(item => item.id && item.label && item.weight > 0);
}

function cleanNodeComments(value: unknown): NodeComment[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((raw, index) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const nodeId = cleanText(item.nodeId, 120);
    const comment = cleanText(item.comment, 1800);
    return {
      id:cleanText(item.id || `node_comment_${index + 1}`, 120),
      nodeId,
      comment,
    };
  }).filter(item => item.nodeId && item.comment);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, organizationId, profileId:teacherProfileId } = await requireTeacherSession(request);
    const body = await request.json().catch(() => ({}));
    const studentId = cleanText(body.studentId, 80);
    if (!studentId) return jsonResponse({ ok:false, error:"missing_student" }, 400);

    const { data:student, error:studentError } = await admin.from("profiles")
      .select("id,organization_id,role")
      .eq("id", studentId)
      .eq("organization_id", organizationId)
      .eq("role", "student")
      .single();
    if (studentError || !student) return jsonResponse({ ok:false, error:"student_not_found" }, 404);

    const criteria = cleanCriteria(body.criteria);
    if (!criteria.length) return jsonResponse({ ok:false, error:"missing_criteria" }, 400);
    const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) return jsonResponse({ ok:false, error:"invalid_weights" }, 400);

    const score = Math.round(
      (criteria.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight) * 100,
    ) / 100;
    const now = new Date().toISOString();
    const breakdown = {
      schema:"rayuela-rubric-v1",
      criteria,
      totalWeight,
      overallComment:cleanText(body.overallComment, 4000),
      nodeComments:cleanNodeComments(body.nodeComments),
      projectId:cleanText(body.projectId, 120),
      submissionId:cleanText(body.submissionId, 120),
      evaluatedBy:teacherProfileId,
      evaluatedAt:now,
    };

    const { error:evaluationError } = await admin.from("evaluations").upsert({
      profile_id:studentId,
      classroom_id:null,
      scope:"game",
      game_id:"rayuela",
      score,
      breakdown,
      updated_at:now,
    }, { onConflict:"profile_id,scope,game_id" });
    if (evaluationError) throw evaluationError;

    return jsonResponse({ ok:true, score, breakdown, updatedAt:now });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("teacher-rayuela-evaluation failed", error);
    return jsonResponse({ ok:false, error:"evaluation_unavailable" }, 503);
  }
});
