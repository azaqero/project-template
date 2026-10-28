#!/usr/bin/env node
/**
 * Rejects regional Spanish in the project copy before it reaches a build.
 *
 * The standard is neutral Latin American Spanish: no voseo and no Rioplatense
 * vocabulary. This is a gate, not a style opinion: one "podés" is enough to
 * tell a reader the product was written for another market.
 *
 * Usage: node scripts/check-copy.mjs [dir ...]
 *        defaults to `src`.
 *
 * [ADAPT] Extend RULES when a new idiom slips through. Keep it a closed list:
 * a generic "any voseo verb" regex flags legitimate Spanish, and a gate that
 * cries wolf gets disabled.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const targets = (args.length ? args : ['src']).map((p) => resolve(root, p));
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.astro', '.vue', '.svelte', '.md']);

const RULES = [
  {
    kind: 'voseo',
    re: /\b(podés|querés|tenés|sabés|necesitás|hacés|sos|vivís|decís|venís|salís|escribís|pedís|elegís|seguís|sentís|dormís)\b/gi,
  },
  {
    kind: 'voseo imperative',
    re: /\b(escribime|contame|mirá|fijate|andá|vení|decile|tomá|sentate|acordate|probá|usá|buscá|mandá|pagá|entrá|salí|elegí|pedí|seguí|poné|hacé|decí|escuchá|esperá|empezá|terminá|hacete)\b/gi,
  },
  { kind: 'idiom', re: /\bde punta a punta\b/gi },
  { kind: 'idiom', re: /\b(me|te|se|nos) hago cargo\b/gi },
  { kind: 'idiom', re: /\bhacerme cargo\b/gi },
  { kind: 'idiom', re: /\bhacerse cargo\b/gi },
  { kind: 'idiom', re: /\brespondo por\b/gi },
  { kind: 'idiom', re: /\bse hojea\b/gi },
  { kind: 'idiom', re: /\bdio verde\b/gi },
  { kind: 'idiom', re: /\bandamiaje\b/gi },
  { kind: 'idiom', re: /\btipear\b/gi },
  { kind: 'idiom', re: /\baguantar (tráfico|carga)\b/gi },
  { kind: 'idiom', re: /\bempresa chica\b/gi },
  { kind: 'idiom', re: /\b(tareas?|cosas?) chic[ao]s\b/gi },
  { kind: 'idiom', re: /\bturnos\b/gi },
  { kind: 'idiom', re: /\bhusos horarios\b/gi },
  { kind: 'idiom', re: /\bsalte(ar|o|ás|a|an)\b/gi },
  { kind: 'idiom', re: /\bsin pisarse\b/gi },
  { kind: 'idiom', re: /\bcomercio adentro\b/gi },
  { kind: 'idiom', re: /\bencaro\b/gi },
  { kind: 'idiom', re: /\ba fines de\b/gi },
  {
    kind: 'vocabulary',
    re: /\b(laburo|plata|guita|quilombo|copado|pibe|bondi|subte|frutilla|palta|acá|che)\b/gi,
  },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(extname(full))) out.push(full);
  }
  return out;
}

const findings = [];
let scanned = 0;

for (const target of targets) {
  if (!existsSync(target)) {
    console.error(`Missing directory: ${target}`);
    process.exit(1);
  }

  for (const file of walk(target)) {
    scanned++;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      for (const rule of RULES) {
        for (const match of line.matchAll(rule.re)) {
          findings.push({
            file: file.replace(root + '/', ''),
            line: index + 1,
            kind: rule.kind,
            value: match[0],
          });
        }
      }
    });
  }
}

if (findings.length) {
  console.error(`\n${findings.length} regional expression(s) found in ${scanned} files:\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  [${f.kind}]  "${f.value}"`);
  }
  console.error('\nRewrite these in neutral Latin American Spanish before building.');
  process.exit(1);
}

console.log(`Clean: ${scanned} files scanned, no regional copy found.`);
