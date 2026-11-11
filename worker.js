const cors = {};
function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", ...cors}});
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:cors});
    if (url.pathname === "/api/daily-average" && request.method === "GET") {
      const day = url.searchParams.get("day");
      const game = url.searchParams.get("game") === "nj" ? "nj" : "pa";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) return json({error:"Invalid day"},400);
      const row = game === "nj"
        ? await env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(AVG(score), 0) AS average FROM daily_scores WHERE day = ? AND player_id LIKE 'nj-%'").bind(day).first()
        : await env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(AVG(score), 0) AS average FROM daily_scores WHERE day = ? AND player_id NOT LIKE 'nj-%'").bind(day).first();
      return json({day,count:row.count,average:Math.round(row.average*100)/100});
    }
    if (url.pathname === "/api/score" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({error:"Invalid JSON"},400); }
      const {day,score,playerId} = body || {};
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "") || !Number.isInteger(score) || score < 0 || score > 1000 || typeof playerId !== "string" || !/^[a-zA-Z0-9-]{12,80}$/.test(playerId)) return json({error:"Invalid score submission"},400);
      const today = new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York"}).format(new Date());
      if (day !== today) return json({error:"Scores can only be submitted for today"},400);
      await env.DB.prepare("INSERT OR IGNORE INTO daily_scores (day, player_id, score, created_at) VALUES (?, ?, ?, datetime('now'))").bind(day,playerId,score).run();
      const row = playerId.startsWith("nj-")
        ? await env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(AVG(score), 0) AS average FROM daily_scores WHERE day = ? AND player_id LIKE 'nj-%'").bind(day).first()
        : await env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(AVG(score), 0) AS average FROM daily_scores WHERE day = ? AND player_id NOT LIKE 'nj-%'").bind(day).first();
      return json({day,count:row.count,average:Math.round(row.average*100)/100});
    }
    if (url.pathname.startsWith("/api/")) return json({error:"Not found"},404);
    return env.ASSETS.fetch(request);
  }
};