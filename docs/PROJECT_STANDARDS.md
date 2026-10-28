# PROJECT STANDARDS

How work is planned, written, shipped and reviewed in this repository.
Copy this file to a new project, adapt the sections marked **[ADAPT]**,
and reference it from `AGENTS.md` / `CLAUDE.md` so agents follow it too.

Two tiers:

- **Non-negotiables** — never relaxed. Breaking one is a defect, not a tradeoff.
- **Defaults** — the starting point. Changing one requires a written reason,
  ideally an ADR.

---

## 0. Non-negotiables

1. No claim without evidence you can reproduce.
2. No private data in the repository or the published artifact.
3. No hidden behavior: if the site or app does something, the user can tell.
4. One source of truth per fact.
5. Generated artifacts are generated, never hand-edited.
6. The release path is one command, and it fails closed.
7. Every significant decision has a written record.
8. Commits contain no AI attribution.

---

## 1. Language and copy

- **Conversation language** follows the user. **Artifact language** defaults to
  English: code, identifiers, comments, documentation, commit messages, tests,
  UI copy — unless the project's audience is Spanish-speaking.
- **Spanish is neutral Latin American Spanish**, not Rioplatense and not
  peninsular. No voseo. No regional idioms.
- Every visible string exists once per locale in a content module, never
  inline in markup.
- If the product is bilingual, both versions are complete. A missing
  translation is a bug, not a nice-to-have.

### Spanish quick reference

| Avoid (Rioplatense) | Use (neutral) |
|---|---|
| podés, tenés, querés, necesitás, escribime | puedes, tienes, quieres, necesitas, escríbeme |
| de punta a punta | de principio a fin |
| me hago cargo / hacerse cargo | me encargo / asumir la responsabilidad |
| aguantar tráfico / carga | soportar tráfico / carga |
| empresa chica, tareas chicas | empresa pequeña, tareas pequeñas |
| turnos (citas) | citas |
| husos horarios | zonas horarias |
| se hojea | se revisa por encima |
| dio verde (un test) | pasó (un test) |
| tipear | escribir |
| andamiaje (de tests) | estructura inicial (de tests) |
| saltear | omitir |
| sin pisarse | sin interferir entre sí |
| encaro | abordo |
| a fines de | a finales de |
| acá, plata, laburo, che | aquí, dinero, trabajo — |

**Enforced by**: `scripts/check-copy.mjs` — closed-list lint over the source
tree, run before every build. Expand the list when a new idiom slips through;
never replace it with a generic regex that produces false positives.
**[ADAPT]** vocabulary list to your audience.

---

## 2. Simplicity and stack

- Build the least runtime that satisfies the requirement. A content site is
  static: no server, no database, no client-side JavaScript.
- Add a dependency only when a requirement forces it, and say why in one
  sentence.
- Use the stack the maintainer already knows. Learning a new language for a
  small deliverable is a cost with no offsetting benefit.
- No framework for what four pages can do; no build step for what one HTML
  file can do.
- **[ADAPT]** the actual stack and versions.
- Record the choice and the rejected alternatives in an ADR (see §11).

**Rule of thumb**: if a senior engineer would ask "why is this here?", the
answer belongs in an ADR or the dependency should not be here.

---

## 3. Content and single source of truth

- Structured content lives as typed data (one module per section), not as
  hand-edited HTML. Markup renders from data.
- Facts appear in exactly one place. Identity, contact details, prices and
  dates are referenced, never retyped.
- Generated documents derive from the same source as the page they mirror.
- Changing a fact should be a one-line change.

---

## 4. Bilingual delivery **[ADAPT: only if multilingual]**

- One default locale, explicit prefix for the others. Routes and slugs are
  translated, not mirrored.
- Navigation is derived from the list of routes that actually exist, so a
  published link cannot 404.
- Every page declares its counterpart: canonical, `hreflang`, and
  `x-default`.
- Locale parity is checked mechanically where the artifact is generated
  (same item count, same numeric claims).

---

## 5. Privacy and data exposure

- Publish a **role alias**, never a personal mailbox. Never publish a phone
  number.
- The private address and phone number are never written in the repository.
  No denylist — a denylist has to contain the secret. Use an **allowlist**.
- Scan the **build artifact**, not only the source: HTML, PDFs (text
  extraction), and image metadata (EXIF).
- Git commit authors use a GitHub noreply alias.
- No client code, credentials or confidential data in public pages or assets.
- The leak check is part of the release command and blocks it.

**Enforced by**: `scripts/check-leaks.mjs`.
**[ADAPT]** the allowlist of published addresses.

---

## 6. Metadata and discovery

- `canonical` on every indexable page.
- `hreflang` for each locale plus `x-default`.
- Open Graph and Twitter cards complete: title, description, image,
  image dimensions, image type, and **localized alt text**.
- One social card per locale, generated from source, at the platform's
  recommended size.
- Structured data (`JSON-LD`) describes the entity, localized, with
  `inLanguage`.
- `sitemap.xml` and `robots.txt` exist and are verified.
- A missing page returns a real `404`, never a soft redirect to the home page.
- All metadata URLs are absolute.

**Enforced by**: deploy verification script.
**Not adopted**: `llms.txt`. No measurable effect as of 2026; `robots.txt`,
sitemap, semantic HTML and structured data are the real channels.

---

## 7. Accessibility and UX

- Semantic HTML first. One `<h1>` per page.
- Skip link, focus-visible styles, meaningful `alt` text.
- Contrast checked in both light and dark mode.
- No JavaScript required to read content or navigate.
- Touch targets at least 44px.
- A missing optional asset degrades gracefully; absence is a supported state.
- Content is readable with CSS disabled.

---

## 8. Generated artifacts

- Anything derived (PDFs, social cards, thumbnails, feeds) is generated
  from source, never edited by hand.
- Commit the artifact only if the deploy target cannot build it.
- If a required tool is missing, the generator **fails** with an explanatory
  message instead of writing a stale file.
- Generation should be **deterministic**: two runs over unchanged content
  produce identical bytes. If the tool injects timestamps or random IDs,
  normalize them (fixed dates, deterministic document IDs) and verify with
  hashes.

**Enforced by**: generator scripts plus a reproducibility check.
**[ADAPT]** which artifacts this project generates.

---

## 9. Release gates

- Exactly one command produces a deployable artifact. Running the steps
  separately is how an unchecked artifact ships.
- Order matters: copy check → build → generate artifacts → leak check →
  verification.
- Every gate fails closed with a non-zero exit and a message naming the file
  and line.
- Staging uses the same gates as production.

**Template**

```json
{
  "scripts": {
    "check:copy":  "node scripts/check-copy.mjs",
    "check:leaks": "node scripts/check-leaks.mjs",
    "release":     "npm run check:copy && npm run build && npm run artifacts && npm run check:leaks"
  }
}
```

---

## 10. Deploy and rollback

- The deploy target serves files; it does not build.
- The build output directory is the entire deployable artifact.
- Moved pages return `301`; deliberately removed content returns `410`.
  Never redirect removed content to the home page.
- The host's config file (`.htaccess`, `_headers`, etc.) travels with the
  artifact — dotfiles are silently skipped by some clients, so verify after
  upload.
- Rollback is a directory rename, measured in seconds. No rebuild, no DNS.
- Backups are downloaded locally, not left only on the server.
- Live verification is automated and covers pages, assets, metadata, redirects
  and the unknown-URL case.
- **The check that matters most and nobody remembers**: email/contact still
  works after deploy.

**Enforced by**: `scripts/verify-deploy.mjs` against staging and production.

---

## 11. Decisions and documentation

- Every significant choice becomes an **ADR**: context, decision,
  consequences (positive and negative), alternatives considered and why they
  were rejected.
- ADRs are dated and written **before** the code.
- ADRs never contain secrets. Saying "deliberately omitted" is part of the
  decision, not an oversight.
- `README.md` explains what the project is, how to run it, and where the
  reasoning lives.
- The deploy checklist is the *how*; the ADR is the *why*. Keep them separate
  and cross-linked.
- A runbook step that cannot be verified is not a step.

---

## 12. Git

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`,
  `build:`).
- No `Co-Authored-By`, no AI attribution, no tool signatures.
- Commits are reviewable work units: one concern per commit, tests and docs
  alongside the behavior they describe.
- Never commit: secrets, private planning docs, build output, agent
  artifacts, `node_modules`.
- Before committing, inspect `git status`, `git diff` and recent history.
- Do not reformat or delete unrelated code in a commit that fixes something.

**Enforced by**: `.gitignore` and review.

---

## 13. Review and done

Definition of done for any change:

- [ ] The requirement is written down and the code matches it.
- [ ] New behavior has a test, or the reason it cannot be tested is written.
- [ ] Copy is neutral Spanish (or the project's target language).
- [ ] No private data in source or build.
- [ ] Metadata updated if the page changed.
- [ ] Generated artifacts regenerated and committed.
- [ ] Release command passes end to end.
- [ ] Deploy verification passes on staging.
- [ ] The decision is in an ADR if it was significant.

Risk line for every change, one of:

- `Risk: none` — copy, docs, formatting.
- `Risk: item N (reason)` — data, security, contracts, concurrency, delivery,
  or no test would catch a regression.

---

## 14. Bootstrap checklist for a new project

1. Create the repo, `.gitignore`, `README.md`, `AGENTS.md` referencing this
   file.
2. Pick the stack; write ADR 0001 with the alternatives rejected.
3. Create `scripts/check-leaks.mjs` with the allowlist before publishing
   anything.
4. Create the content modules and the route skeleton.
5. Add metadata: canonical, locale alternates, social cards, structured data,
   sitemap, robots.
6. Add the release command with all gates wired in order.
7. Add the deploy verification script.
8. Write the deploy runbook and record the rollback path.
9. Add `scripts/check-copy.mjs` if the project has Spanish copy.
10. Deploy to staging, run verification, promote, verify live, confirm contact
    still works.

---

## 15. Adaptation notes

| Section | What changes per project |
|---|---|
| §2 Stack | Framework, language, build tool, versions |
| §4 Bilingual | Locales, routing strategy, slug scheme |
| §5 Privacy | Allowlisted addresses, whether a phone exists |
| §8 Artifacts | Which documents and images are generated |
| §9 Release | Actual commands and gate order |
| §10 Deploy | Host, config file, redirect policy |

Everything else is the standard.
