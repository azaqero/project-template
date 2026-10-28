#!/usr/bin/env node
/**
 * Scans build output for personal data before it is published.
 *
 * Deliberately an allowlist, not a denylist. A denylist has to contain the very
 * strings it protects, which means writing the private address and phone number
 * into a public repository — the exact failure this check exists to prevent.
 * Instead: any email found in the build must be explicitly allowed, and
 * anything resembling a phone number is reported.
 *
 * Scans the artifact, not the source, because generated binaries (PDFs, images)
 * cannot be inspected by reading the code that produced them.
 *
 * Usage: node scripts/check-leaks.mjs [dir ...]
 *        defaults to `dist` and `public`.
 *
 * [ADAPT] Replace the placeholder below with the addresses this project is
 * allowed to publish. Keep the list as small as possible.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not URL.pathname: a path containing non-ASCII characters
// comes back percent-encoded from pathname and never resolves on disk.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const targets = (args.length ? args : ['dist', 'public']).map((p) => resolve(root, p));

/** [ADAPT] The only addresses allowed to appear in anything published. */
const ALLOWED_EMAILS = new Set(['alias@example.com']);

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.txt', '.css', '.js', '.json', '.svg', '.md', '.webmanifest']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
// A phone number here means 9 or more digits, optionally grouped or prefixed.
const PHONE_RE = /(\+\d[\d\s().-]{7,}\d)|(\b\d{3}[\s.-]\d{3}[\s.-]\d{3,4}\b)/g;

const findings = [];
let scanned = 0;

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function report(file, kind, value) {
  findings.push({ file: file.replace(root + '/', ''), kind, value });
}

function checkText(file, text) {
  for (const match of text.matchAll(EMAIL_RE)) {
    const email = match[0].toLowerCase();
    if (!ALLOWED_EMAILS.has(email)) report(file, 'email', match[0]);
  }
  for (const match of text.matchAll(PHONE_RE)) {
    report(file, 'phone-like', match[0].trim());
  }
}

for (const target of targets) {
  for (const file of walk(target)) {
    const ext = extname(file).toLowerCase();
    scanned++;

    if (TEXT_EXTENSIONS.has(ext)) {
      checkText(file, readFileSync(file, 'utf8'));
      continue;
    }

    if (ext === '.pdf') {
      const pdftotext = spawnSync('pdftotext', [file, '-'], { encoding: 'utf8' });
      if (pdftotext.status === 0) {
        checkText(file, pdftotext.stdout);
      } else {
        // Fall back to scanning raw bytes so a missing tool cannot silently skip.
        checkText(file, readFileSync(file).toString('latin1'));
      }
      continue;
    }

    if (IMAGE_EXTENSIONS.has(ext)) {
      // Metadata is the usual way personal data enters an image: GPS, camera,
      // author. Checked only when exiftool is available.
      const probe = spawnSync('exiftool', ['-s', '-GPS:all', '-Author', '-Artist', '-Creator', file], {
        encoding: 'utf8',
      });
      if (probe.status === 0) {
        const suspicious = probe.stdout
          .split('\n')
          .filter((line) => line.trim() && !/: *$/.test(line))
          .filter((line) => !/\b0{2,}\b/.test(line));
        if (suspicious.length) report(file, 'image-metadata', suspicious.join('; '));
      }
    }
  }
}

if (findings.length) {
  console.error(`\n${findings.length} problem(s) found in ${scanned} files:\n`);
  for (const f of findings) {
    console.error(`  ${f.file}  [${f.kind}]  ${f.value}`);
  }
  console.error('\nRemove or replace these before deploying.');
  process.exit(1);
}

console.log(`Clean: ${scanned} files scanned, no unexpected email or phone data.`);
