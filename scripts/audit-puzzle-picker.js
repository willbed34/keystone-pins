#!/usr/bin/env node
"use strict";

// Lightweight regression audit for the inline daily-puzzle selectors.
// Run with: node scripts/audit-puzzle-picker.js
const fs = require("node:fs");
const pathUtil = require("node:path");
const vm = require("node:vm");

const root = pathUtil.resolve(__dirname, "..");
const pages = [
  { path: "index.html", tiers: [21, 20, 4, 5, 5], days: 30, college: false },
  { path: "new-jersey/index.html", tiers: [11, 12, 12, 12, 13], days: 30, college: false },
  { path: "new-york/index.html", tiers: [17, 20, 8, 8, 8], days: 30, college: false },
  { path: "colleges/index.html", days: 210, college: true }
];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing ${name}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unclosed ${name}`);
}

function buildSchedulePicker(pageSource) {
  const shuffled = extractFunction(pageSource, "shuffledTier");
  const picker = extractFunction(pageSource, "pickPuzzleWithCooldown")
    .replace("let chosen=[];", "let chosen=[],schedule=[];")
    .replace(
      "chosen.forEach(place=>{if(place)history.push(key(place));});",
      "chosen.forEach(place=>{if(place)history.push(key(place));});schedule.push(chosen.slice());"
    )
    .replace("return chosen;", "return schedule;");
  return new Function(`${shuffled};${picker};return pickPuzzleWithCooldown;`)();
}

function assertSchedule(label, schedule, poolSize, key) {
  const history = [];
  let firstRepeat = null;
  for (let day = 0; day < schedule.length; day++) {
    const answers = schedule[day];
    if (answers.length !== 5 || answers.some(x => !x)) {
      throw new Error(`${label}: day ${day + 1} did not produce five answers`);
    }
    const today = answers.map(key);
    if (new Set(today).size !== 5) {
      throw new Error(`${label}: duplicate answer on day ${day + 1}`);
    }
    const recent = new Set(history.slice(-35));
    if (today.some(answer => recent.has(answer))) {
      throw new Error(`${label}: seven-day repeat on day ${day + 1}`);
    }
    if (!firstRepeat && today.some(answer => history.includes(answer))) {
      firstRepeat = day + 1;
    }
    history.push(...today);
  }
  const earliestAllowedRepeat = Math.floor(poolSize / 5) + 1;
  if (firstRepeat && firstRepeat < earliestAllowedRepeat) {
    throw new Error(`${label}: repeated on day ${firstRepeat}, before exhausting the ${poolSize}-place pool`);
  }
  console.log(`PASS ${label}: ${schedule.length} days, ${poolSize} unique places, first repeat ${firstRepeat || "not reached"}`);
}

for (const page of pages) {
  const source = fs.readFileSync(pathUtil.join(root, page.path), "utf8");
  const inlineScript = source.match(/<script>([\s\S]*?)<\/script>/);
  if (!inlineScript) throw new Error(`${page.path}: missing inline script`);
  new vm.Script(inlineScript[1], { filename: page.path });
  if (!source.includes("map.flyToBounds(bounds")) throw new Error(`${page.path}: answer-fit zoom missing`);
  if (source.includes("zoomBackToStart(")) throw new Error(`${page.path}: old full-map zoom still present`);

  const picker = buildSchedulePicker(source);
  let tiers;
  let key;
  if (page.college) {
    const data = JSON.parse(fs.readFileSync(pathUtil.join(root, "colleges/colleges.json"), "utf8"));
    tiers = data;
    key = x => `${String(x.name).trim().toLowerCase()}|${String(x.state).trim().toUpperCase()}`;
  } else {
    let next = 0;
    tiers = page.tiers.map(size => Array.from({ length: size }, () => ({ n: `Place ${++next}` })));
    key = x => x.n.toLowerCase();
  }
  const poolSize = new Set(tiers.flat().map(key)).size;
  const schedule = picker(tiers, page.days);
  assertSchedule(page.path, schedule, poolSize, key);
}
