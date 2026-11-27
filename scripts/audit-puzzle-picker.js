#!/usr/bin/env node
"use strict";

// Regression audit for the inline daily-puzzle selectors.
// Run with: node scripts/audit-puzzle-picker.js
const fs = require("node:fs");
const pathUtil = require("node:path");
const vm = require("node:vm");

const root = pathUtil.resolve(__dirname, "..");
const pages = [
  { path: "index.html", tiers: [20, 15, 15, 15, 15], days: 30, college: false },
  { path: "new-jersey/index.html", tiers: [20, 15, 15, 15, 15], days: 30, college: false },
  { path: "new-york/index.html", tiers: [20, 15, 15, 15, 15], days: 30, college: false },
  { path: "colleges/index.html", days: 210, college: true }
];

function extractFunction(source, name) {
  const start = source.indexOf(\`function \${name}(\`);
  if (start < 0) throw new Error(\`Missing \${name}\`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(\`Unclosed \${name}\`);
}

function buildSchedulePicker(pageSource) {
  const shuffled = extractFunction(pageSource, "shuffledTier");
  const picker = extractFunction(pageSource, "pickPuzzleWithCooldown")
    .replace("let chosen=[];", "let chosen=[],schedule=[];")
    .replace("  }\n  return chosen;", "    schedule.push(chosen.slice());\n  }\n  return schedule;");
  return new Function(\`\${shuffled};\${picker};return pickPuzzleWithCooldown;\`)();
}

function assertSchedule(label, schedule, key) {
  const lastUsedDay = new Map();
  for (let day = 0; day < schedule.length; day++) {
    const answers = schedule[day];
    if (answers.length !== 5 || answers.some(x => !x)) {
      throw new Error(\`\${label}: day \${day + 1} did not produce five answers; the pool must have at least 75 unique locations\`);
    }
    const today = answers.map(key);
    if (new Set(today).size !== 5) throw new Error(\`\${label}: duplicate answer on day \${day + 1}\`);
    for (const answer of today) {
      const last = lastUsedDay.get(answer);
      if (last !== undefined && day + 1 - last <= 14) {
        throw new Error(\`\${label}: \${answer} repeated within 14 days on day \${day + 1} (last used day \${last})\`);
      }
      lastUsedDay.set(answer, day + 1);
    }
  }
  console.log(\`PASS \${label}: \${schedule.length} days, strict 14-day exclusion\`);
}

for (const page of pages) {
  const source = fs.readFileSync(pathUtil.join(root, page.path), "utf8");
  const scriptStart = source.indexOf("<script>") + 8;
  const scriptEnd = source.indexOf("</script>", scriptStart);
  if (scriptStart < 8 || scriptEnd < 0) throw new Error(\`\${page.path}: missing inline script\`);
  new vm.Script(source.slice(scriptStart, scriptEnd), { filename: page.path });
  if (!source.includes("map.flyToBounds(bounds")) throw new Error(\`\${page.path}: answer-fit zoom missing\`);
  if (source.includes("zoomBackToStart(")) throw new Error(\`\${page.path}: old full-map zoom still present\`);

  const picker = buildSchedulePicker(source);
  let tiers, key;
  if (page.college) {
    tiers = JSON.parse(fs.readFileSync(pathUtil.join(root, "colleges/colleges.json"), "utf8"));
    key = x => \`\${String(x.name).trim().toLowerCase()}|\${String(x.state).trim().toUpperCase()}\`;
  } else {
    let next = 0;
    tiers = page.tiers.map(size => Array.from({ length: size }, () => ({ n: \`Place \${++next}\` })));
    key = x => x.n.toLowerCase();
  }
  assertSchedule(page.path, picker(tiers, page.days), key);
}
