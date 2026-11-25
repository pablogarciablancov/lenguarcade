// Retired cooperative event. Keep this deployed endpoint as a tombstone so
// cached clients cannot create battles or trigger reward settlement.
import {corsHeaders,jsonResponse} from "../_shared/lenguarcade.ts";

Deno.serve((request:Request) => request.method === "OPTIONS"
  ? new Response("ok",{headers:corsHeaders})
  : jsonResponse({ok:false,error:"class_boss_retired"},410));
