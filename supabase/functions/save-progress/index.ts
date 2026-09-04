import {
  boundedNumber,
  corsHeaders,
  jsonResponse,
  requireProfileSession,
} from "../_shared/lenguarcade.ts";

function cleanAchievement(value: unknown) {
  if (typeof value === "string") {
    return { id:value.slice(0, 120), title:value.slice(0, 180), description:"", xpReward:0, hidden:false };
  }
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = String(item.id || item.achievementId || "").trim().slice(0, 120);
  return {
    id,
    title:String(item.title || item.name || id || "Logro").slice(0, 180),
    description:String(item.description || "").slice(0, 500),
    xpReward:Math.round(boundedNumber(item.xpReward, 0, 10000)),
    hidden:Boolean(item.hidden),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, profileId } = await requireProfileSession(request);
    const body = await request.json().catch(() => ({}));
    const gameId = String(body.gameId || "").trim().slice(0, 80);
    const resultId = String(body.resultId || "").trim().slice(0, 180);
    if (!gameId) return jsonResponse({ ok:false, error:"missing_game_id" }, 400);

    const { data:game } = await admin.from("games").select("id").eq("id", gameId).maybeSingle();
    if (!game) return jsonResponse({ ok:false, error:"unknown_game" }, 400);
    if (resultId) {
      const { data:duplicate } = await admin.from("game_events")
        .select("id")
        .eq("profile_id", profileId)
        .eq("game_id", gameId)
        .eq("result_id", resultId)
        .maybeSingle();
      if (duplicate) return jsonResponse({ ok:true, duplicate:true });
    }

    const { data:old } = await admin.from("game_progress")
      .select("*")
      .eq("profile_id", profileId)
      .eq("game_id", gameId)
      .maybeSingle();
    const rawGameData = body.rawGameData && typeof body.rawGameData === "object" ? body.rawGameData : {};
    const save = rawGameData.save && typeof rawGameData.save === "object"
      ? rawGameData.save as Record<string, unknown>
      : body.save && typeof body.save === "object" ? body.save as Record<string, unknown> : null;
    const clientProgress = body.progress && typeof body.progress === "object"
      ? body.progress as Record<string, unknown>
      : {};
    const oldXp = Number(old?.xp || 0);
    const oldFeathers = Number(old?.feathers || 0);

    let progress: Record<string, unknown> = clientProgress;
    let authoritativeRayuelaXp: number | null = null;
    let authoritativeEntreLineasXp: number | null = null;
    let rayuelaSubmissionFeathers = 0;
    let entreLineasSolvedFeathers = 0;

    if (gameId === "entre_lineas" && save) {
      const profile = save.profile && typeof save.profile === "object"
        ? save.profile as Record<string, unknown>
        : {};
      const metrics = rawGameData.metrics && typeof rawGameData.metrics === "object"
        ? rawGameData.metrics as Record<string, unknown>
        : {};
      const lastSession = rawGameData.lastSession && typeof rawGameData.lastSession === "object"
        ? rawGameData.lastSession as Record<string, unknown>
        : {};
      authoritativeEntreLineasXp = Math.max(
        0,
        Math.round(boundedNumber(profile.xp, 0, 100000000, oldXp)),
      );
      const solved = String(lastSession.outcome || "").toLowerCase() === "solved" ||
        metrics.success === true;
      const taskScore = boundedNumber(metrics.taskScore, 0, 100, Number(old?.accuracy || 0));
      const cluesImportant = Math.max(0, Math.round(boundedNumber(metrics.cluesImportant, 0, 100000)));
      const cluesTotal = Math.max(0, Math.round(boundedNumber(metrics.cluesTotal, 0, 100000)));
      const tasksCorrect = Math.max(0, Math.round(boundedNumber(metrics.tasksCorrect, 0, 100000)));
      const tasksTotal = Math.max(0, Math.round(boundedNumber(metrics.tasksTotal, 0, 100000)));
      const keyConnections = Math.max(0, Math.round(boundedNumber(metrics.keyConnections, 0, 100000)));
      const irrelevantClues = Math.max(0, Math.round(boundedNumber(metrics.irrelevantClues, 0, 100000)));
      const finalAttempts = Math.max(0, Math.round(boundedNumber(metrics.finalAttempts, 0, 100000)));
      const sessionSuccesses = cluesImportant + tasksCorrect + keyConnections;
      const sessionErrors = Math.max(0, cluesTotal - cluesImportant) +
        Math.max(0, tasksTotal - tasksCorrect) +
        irrelevantClues +
        Math.max(0, finalAttempts - 1);
      const attempts = Number(old?.attempts || 0) + sessionSuccesses + sessionErrors;
      const successes = Number(old?.successes || 0) + sessionSuccesses;
      const errors = Number(old?.errors || 0) + sessionErrors;
      const accuracy = attempts ? Math.round((successes / attempts) * 100) : taskScore;
      const previousCases = Number(
        old?.raw_data && typeof old.raw_data === "object" &&
        (old.raw_data as Record<string, unknown>).save &&
        typeof (old.raw_data as Record<string, unknown>).save === "object"
          ? (((old.raw_data as Record<string, unknown>).save as Record<string, unknown>).profile as Record<string, unknown> | undefined)?.cases || 0
          : 0,
      );
      const currentCases = Math.max(0, Math.round(boundedNumber(profile.cases, 0, 100000, previousCases)));
      entreLineasSolvedFeathers = solved && currentCases > previousCases
        ? Math.max(1, Math.min(8, Math.round(taskScore / 25)))
        : 0;
      progress = {
        ...clientProgress,
        percentage:Math.max(Number(old?.percentage || 0), solved ? 100 : taskScore),
        accuracy,
        attempts,
        successes,
        errors,
        streak:Math.max(Number(old?.streak || 0), keyConnections),
      };
    }

    if (gameId === "rayuela" && save) {
      const nodes = Array.isArray(save.nodes) ? save.nodes as Record<string, unknown>[] : [];
      const choices = nodes.reduce((sum, node) => {
        const nodeChoices = Array.isArray(node.choices) ? node.choices as Record<string, unknown>[] : [];
        return sum + nodeChoices.filter(choice => String(choice.targetId || "")).length;
      }, 0);
      const endings = nodes.filter(node => node.type === "ending" || node.type === "secret").length;
      const start = nodes.find(node => node.type === "start") || nodes[0] || null;
      const byId = new Map(nodes.map(node => [String(node.id || ""), node]));
      const reachable = new Set<string>();
      const queue = start ? [String(start.id || "")] : [];
      while (queue.length) {
        const id = queue.shift()!;
        if (!id || reachable.has(id)) continue;
        reachable.add(id);
        const node = byId.get(id);
        const nodeChoices = node && Array.isArray(node.choices) ? node.choices as Record<string, unknown>[] : [];
        for (const choice of nodeChoices) {
          const target = String(choice.targetId || "");
          if (target && !reachable.has(target)) queue.push(target);
        }
      }
      let structuralErrors = start ? 0 : 1;
      if (!endings) structuralErrors += 1;
      for (const node of nodes) {
        const isEnding = node.type === "ending" || node.type === "secret";
        const nodeChoices = Array.isArray(node.choices) ? node.choices as Record<string, unknown>[] : [];
        if (!isEnding && nodeChoices.length === 0) structuralErrors += 1;
        structuralErrors += nodeChoices.filter(choice => !String(choice.targetId || "")).length;
        if (start && !reachable.has(String(node.id || ""))) structuralErrors += 1;
      }
      const attempts = Math.max(1, nodes.length + choices);
      const objectiveRewards = Array.isArray(save.objectiveRewards) ? save.objectiveRewards.length : 0;
      const percentage = String(save.status || "") === "submitted"
        ? 100
        : Math.min(99, Math.round((objectiveRewards / 8) * 100));
      authoritativeRayuelaXp = Math.max(0, Math.round(boundedNumber(save.xp, 0, 100000000, oldXp)));
      const eventType = String(body.eventType || "").toLowerCase();
      rayuelaSubmissionFeathers = !body.checkpoint && eventType.includes("submitted") ? 3 : 0;
      progress = {
        ...clientProgress,
        percentage:Math.max(Number(old?.percentage || 0), percentage),
        accuracy:Math.max(0, Math.min(100, Math.round(((attempts - Math.min(attempts, structuralErrors)) / attempts) * 100))),
        attempts,
        successes:Math.max(0, attempts - structuralErrors),
        errors:structuralErrors,
        streak:Math.max(endings, Number(old?.streak || 0)),
      };
    }

    const xpDelta = Math.round(boundedNumber(progress.xpDelta, 0, 5000));
    const feathersDelta = gameId === "rayuela"
      ? rayuelaSubmissionFeathers
      : gameId === "entre_lineas"
        ? entreLineasSolvedFeathers
        : Math.round(boundedNumber(progress.plumasDelta ?? progress.feathersDelta, 0, 500));
    const newXp = authoritativeEntreLineasXp != null
      ? Math.max(oldXp, authoritativeEntreLineasXp)
      : authoritativeRayuelaXp == null
        ? (progress.xp == null
            ? oldXp + xpDelta
            : Math.max(oldXp, Math.round(boundedNumber(progress.xp, 0, 100000000))))
        : Math.max(oldXp, authoritativeRayuelaXp);
    const newFeathers = progress.plumas == null && progress.feathers == null
      ? oldFeathers + feathersDelta
      : Math.max(oldFeathers, Math.round(boundedNumber(progress.plumas ?? progress.feathers, 0, 10000000)));
    const now = new Date().toISOString();
    const achievements = Array.isArray(body.achievements)
      ? body.achievements.map(cleanAchievement).filter(item => item.id)
      : [];
    const shouldCountSession = body.countSession === true ||
      (!body.checkpoint && body.countSession !== false && !body.sessionAlreadyCounted);
    const shouldWriteEvent = body.writeEvent === false ? false : shouldCountSession;

    if (achievements.length) {
      await admin.from("achievement_definitions").upsert(
        achievements.map(item => ({
          game_id:gameId,
          id:item.id,
          title:item.title,
          description:item.description,
          xp_reward:item.xpReward,
          hidden:item.hidden,
        })),
        { onConflict:"game_id,id" },
      );
      await admin.from("player_achievements").upsert(
        achievements.map(item => ({
          profile_id:profileId,
          game_id:gameId,
          achievement_id:item.id,
          unlocked_at:now,
        })),
        { onConflict:"profile_id,game_id,achievement_id", ignoreDuplicates:true },
      );
    }

    const { count:achievementCount } = await admin.from("player_achievements")
      .select("*", { count:"exact", head:true })
      .eq("profile_id", profileId)
      .eq("game_id", gameId);
    const record = {
      profile_id:profileId,
      game_id:gameId,
      xp:newXp,
      level:Math.max(1, Math.round(boundedNumber(progress.level ?? progress.nivel, 1, 10000, Number(old?.level || 1)))),
      percentage:boundedNumber(progress.percentage ?? progress.percent, 0, 100, Number(old?.percentage || 0)),
      accuracy:boundedNumber(progress.accuracy, 0, 100, Number(old?.accuracy || 0)),
      attempts:Math.max(Number(old?.attempts || 0), Math.round(boundedNumber(progress.attempts, 0, 100000000, Number(old?.attempts || 0)))),
      successes:Math.max(Number(old?.successes || 0), Math.round(boundedNumber(progress.successes, 0, 100000000, Number(old?.successes || 0)))),
      errors:Math.max(Number(old?.errors || 0), Math.round(boundedNumber(progress.errors, 0, 100000000, Number(old?.errors || 0)))),
      streak:Math.max(Number(old?.streak || 0), Math.round(boundedNumber(progress.streak, 0, 1000000, Number(old?.streak || 0)))),
      sessions:Number(old?.sessions || 0) + (shouldCountSession ? 1 : 0),
      achievements_count:Number(achievementCount || 0),
      missions_completed:Math.max(Number(old?.missions_completed || 0), Math.round(boundedNumber(progress.missionsCompleted, 0, 100000, Number(old?.missions_completed || 0)))),
      feathers:newFeathers,
      raw_data:rawGameData,
      last_activity_at:now,
    };
    const { error:progressError } = await admin.from("game_progress")
      .upsert(record, { onConflict:"profile_id,game_id" });
    if (progressError) throw progressError;

    if (shouldWriteEvent) {
      const { error:eventError } = await admin.from("game_events").insert({
        result_id:resultId || crypto.randomUUID(),
        profile_id:profileId,
        game_id:gameId,
        event_type:String(body.eventType || "progress_saved").slice(0, 100),
        xp_delta:Math.max(0, newXp - oldXp),
        feathers_delta:Math.max(0, newFeathers - oldFeathers),
        accuracy:record.accuracy,
        details:body.details && typeof body.details === "object" ? body.details : {},
        occurred_at:now,
      });
      if (eventError) throw eventError;
    }

    if (save) {
      const { data:oldSave } = await admin.from("game_saves")
        .select("revision")
        .eq("profile_id", profileId)
        .eq("game_id", gameId)
        .eq("slot", "main")
        .maybeSingle();
      const { error:saveError } = await admin.from("game_saves").upsert({
        profile_id:profileId,
        game_id:gameId,
        slot:"main",
        revision:Number(oldSave?.revision || 0) + 1,
        save_data:save,
        saved_at:now,
      }, { onConflict:"profile_id,game_id,slot" });
      if (saveError) throw saveError;
    }

    const errors = Array.isArray(body.errors) ? body.errors.slice(0, 100) : [];
    if (errors.length) {
      await admin.from("game_errors").insert(errors.map((item: Record<string, unknown>) => ({
        profile_id:profileId,
        game_id:gameId,
        skill:String(item.skill || "").slice(0, 120),
        error_type:String(item.type || item.errorType || "").slice(0, 120),
        error_count:Math.max(1, Math.round(boundedNumber(item.count, 1, 10000, 1))),
        details:item,
        occurred_at:now,
      })));
    }

    return jsonResponse({ ok:true, duplicate:false, record });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("save-progress failed", error);
    return jsonResponse({ ok:false, error:"save_unavailable" }, 503);
  }
});
