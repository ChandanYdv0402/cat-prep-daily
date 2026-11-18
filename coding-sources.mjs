import { setTimeout as delay } from "node:timers/promises";

const roster = [
  { name: "Chandan", accounts: { leetcode: "chandankumaryadav_se22a11_33", codechef: "fair_grand_94", codeforces: "BihariBull0402" } },
  { name: "smitjy", accounts: { leetcode: "sj_galdiator", codeforces: "sj_gladiator" } },
  { name: "Amritesh Raj", accounts: { leetcode: "amriteshrajgupta69", codeforces: "amritesh_raj_83" } },
];
const oneDay = 86_400_000;
const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
});
const dayKey = time => indiaDate.format(new Date(time));
let codeforcesQueue = Promise.resolve();
let lastCodeforcesStart = 0;

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(13000) });
  if (!response.ok) throw new Error(new URL(url).hostname + " returned " + response.status);
  return response;
}

function codeforces(method, filters) {
  const task = codeforcesQueue.then(async () => {
    await delay(Math.max(0, lastCodeforcesStart + 2100 - Date.now()));
    lastCodeforcesStart = Date.now();
    const url = "https://codeforces.com/api/" + method + "?" + new URLSearchParams(filters);
    const data = await (await request(url)).json();
    if (data.status !== "OK" || !Array.isArray(data.result)) {
      throw new Error(data.comment || "Unexpected Codeforces response");
    }
    return data.result;
  });
  codeforcesQueue = task.catch(() => {});
  return task;
}

async function leetcode(query, variables = {}) {
  const response = await request("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com/" },
    body: JSON.stringify({ query, variables }),
  });
  const { data } = await response.json();
  if (!data) throw new Error("LeetCode profile data was unavailable");
  return data;
}

async function leetcodeProfile(handle, includeActivity) {
  const data = await leetcode(`query($name: String!) {
    matchedUser(username: $name) { submitStatsGlobal { acSubmissionNum { difficulty count } } }
    userContestRanking(username: $name) { rating }
    ${includeActivity ? "recentAcSubmissionList(username: $name, limit: 15) { titleSlug timestamp }" : ""}
  }`, { name: handle });
  const numbers = data.matchedUser?.submitStatsGlobal?.acSubmissionNum;
  if (!Array.isArray(numbers)) throw new Error("Missing LeetCode solved counts");
  const levels = ["Easy", "Medium", "Hard"].map(level => numbers.find(item => item.difficulty === level)?.count);
  if (!levels.every(Number.isInteger)) throw new Error("Invalid LeetCode difficulty totals");
  return {
    stats: {
      solved: levels[0] + levels[1] + levels[2], levels,
      rating: data.userContestRanking?.rating ?? null,
      points: 5 * levels[0] + 10 * levels[1] + 20 * levels[2],
    },
    recent: data.recentAcSubmissionList ?? [],
  };
}

async function codechefProfile(handle) {
  const response = await request("https://www.codechef.com/users/" + encodeURIComponent(handle));
  const html = await response.text();
  const solved = html.match(/Total Problems Solved:\s*(\d[\d,]*)/)?.[1];
  const rating = html.match(/class=["'][^"']*\brating-number\b[^"']*["'][^>]*>\s*(\d+|Unrated)/i)?.[1];
  if (solved === undefined || (rating === undefined && !/var all_rating\s*=\s*\[\s*\]\s*;/.test(html))) {
    throw new Error("CodeChef profile data was unavailable");
  }
  const count = Number(solved.replaceAll(",", ""));
  return { solved: count, rating: Number(rating) || null, points: count * 10 };
}

function firstAccepts(rows) {
  const problems = new Map();
  for (const entry of rows) {
    const previous = problems.get(entry.key);
    if (!previous || entry.time < previous.time) problems.set(entry.key, entry);
  }
  return [...problems.values()];
}

function countByDay(entries) {
  const counts = {};
  let since = null;
  for (const entry of entries) {
    const day = dayKey(entry.time);
    counts[day] = (counts[day] ?? 0) + 1;
    if (!since || day < since) since = day;
  }
  return { counts, since };
}

function submissionsReport(submissions) {
  const entries = submissions.filter(sub => sub.verdict === "OK" && sub.problem && Number.isFinite(sub.creationTimeSeconds))
    .map(({ problem, creationTimeSeconds }) => ({
      key: [problem.contestId ?? problem.problemsetName, problem.index, problem.name].join("/"),
      time: creationTimeSeconds * 1000,
      points: Math.floor((problem.rating ?? 800) / 100),
    }));
  const solved = firstAccepts(entries);
  const activity = countByDay(solved);
  const lastSubmission = submissions.at(-1);
  if (Number.isFinite(lastSubmission?.creationTimeSeconds)) activity.since = dayKey(lastSubmission.creationTimeSeconds * 1000);
  return {
    stats: { solved: solved.length, points: solved.reduce((sum, entry) => sum + entry.points, 0) },
    activity,
  };
}

function trackTotal(prior, solved, now, firstActivity = { counts: {}, since: null }) {
  const today = dayKey(now);
  const next = prior
    ? { ...prior, counts: { ...prior.counts } }
    : { counts: { ...firstActivity.counts }, since: firstActivity.since ?? today };
  const gain = Number.isInteger(next.solved) ? Math.max(0, solved - next.solved) : 0;
  if (gain) next.counts[today] = (next.counts[today] ?? 0) + gain;
  next.solved = solved;
  return next;
}

function contest(platform, name, start, duration, url) {
  if (!name || !Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0) return [];
  return [{ platform, name, start: new Date(start).toISOString(), duration, url }];
}

async function leetcodeContests() {
  const data = await leetcode("{ upcomingContests { title titleSlug startTime duration } }");
  if (!Array.isArray(data.upcomingContests)) throw new Error("Missing LeetCode contests");
  return data.upcomingContests.flatMap(item => contest("leetcode", item.title, item.startTime * 1000,
    item.duration, "https://leetcode.com/contest/" + encodeURIComponent(item.titleSlug)));
}

async function codechefContests() {
  const response = await request("https://www.codechef.com/api/list/contests/all");
  const data = await response.json();
  if (data.status !== "success" || !Array.isArray(data.future_contests)) throw new Error("Missing CodeChef contests");
  return data.future_contests.flatMap(item => {
    const start = Date.parse(item.contest_start_date_iso);
    const end = Date.parse(item.contest_end_date_iso);
    return contest("codechef", item.contest_name, start, (end - start) / 1000,
      "https://www.codechef.com/" + encodeURIComponent(item.contest_code));
  });
}

async function codeforcesContests() {
  const list = await codeforces("contest.list", { gym: "false" });
  return list.filter(item => item.phase === "BEFORE").flatMap(item => contest("codeforces", item.name,
    item.startTimeSeconds * 1000, item.durationSeconds, "https://codeforces.com/contests/" + item.id));
}

export async function collectCoding(previous = {}, legacyCodeChef = []) {
  const now = Date.now();
  const cutoff = dayKey(now - 132 * oneDay);
  const updated = {
    players: roster.map(player => {
      const cached = previous.players?.find(item => item.name === player.name);
      const stats = Object.fromEntries(Object.entries(cached?.stats ?? {}).filter(([source]) => cached.accounts[source] === player.accounts[source]));
      return { ...player, stats };
    }),
    activity: { ...previous.activity },
    contests: previous.contests ?? [],
    failed: [],
    checkedAt: new Date(now).toISOString(),
  };
  if (!updated.activity.codechef) {
    for (const entry of legacyCodeChef) {
      updated.activity.codechef = trackTotal(updated.activity.codechef, entry.solved, Date.parse(entry.taken_at));
    }
  }
  const tasks = [];
  function update(source, run) {
    tasks.push(run().catch(error => {
      updated.failed.push(source);
      console.warn(source + ": " + error.message);
    }));
  }
  const ratings = codeforces("user.info", { handles: roster.map(player => player.accounts.codeforces).join(";") })
    .catch(error => {
      updated.failed.push("Codeforces ratings");
      console.warn(error.message);
      return [];
    });
  for (const player of updated.players) {
    const personal = player.name === "Chandan";
    update(player.name + " · LeetCode", async () => {
      const { stats, recent } = await leetcodeProfile(player.accounts.leetcode, personal && !updated.activity.leetcode);
      player.stats.leetcode = stats;
      if (personal) {
        const entries = recent.flatMap(item => item.titleSlug && Number.isFinite(Number(item.timestamp))
          ? [{ key: item.titleSlug, time: Number(item.timestamp) * 1000 }] : []);
        updated.activity.leetcode = trackTotal(updated.activity.leetcode, stats.solved, now, countByDay(firstAccepts(entries)));
      }
    });
    update(player.name + " · Codeforces", async () => {
      const [submissions, profiles] = await Promise.all([codeforces("user.status", { handle: player.accounts.codeforces }), ratings]);
      const { stats, activity } = submissionsReport(submissions);
      const account = profiles.find(item => item.handle.toLowerCase() === player.accounts.codeforces.toLowerCase());
      player.stats.codeforces = { ...stats, rating: account ? account.rating ?? null : player.stats.codeforces?.rating ?? null };
      if (personal) updated.activity.codeforces = activity;
    });
    if (player.accounts.codechef) {
      update(player.name + " · CodeChef", async () => {
        const stats = await codechefProfile(player.accounts.codechef);
        player.stats.codechef = stats;
        if (personal) updated.activity.codechef = trackTotal(updated.activity.codechef, stats.solved, now);
      });
    }
  }
  for (const [platform, fetchContests] of Object.entries({ leetcode: leetcodeContests, codechef: codechefContests, codeforces: codeforcesContests })) {
    update(platform + " contests", async () => {
      const events = await fetchContests();
      updated.contests = updated.contests.filter(event => event.platform !== platform).concat(events);
    });
  }
  await Promise.all(tasks);
  updated.contests = updated.contests.filter(event => Date.parse(event.start) >= now)
    .sort((left, right) => Date.parse(left.start) - Date.parse(right.start));
  for (const [platform, activity] of Object.entries(updated.activity)) {
    updated.activity[platform] = { ...activity, counts: Object.fromEntries(Object.entries(activity.counts).filter(([date]) => date >= cutoff)) };
  }
  return updated;
}
