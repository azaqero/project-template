# Project template

Starting point for a new project that follows
[docs/PROJECT_STANDARDS.md](docs/PROJECT_STANDARDS.md).

This repository contains **no application code on purpose**. The stack is a
per-project decision and belongs in ADR 0001. What is shared here is the
contract: how work is written, gated, shipped and reviewed.

## Create a project from this template

From GitHub: **Use this template** → **Create a new repository**.

From the CLI:

```bash
gh repo create <name> --template azaqero/project-template --private --clone
```

## First 30 minutes in the new repository

1. Read `docs/PROJECT_STANDARDS.md` and adapt every section marked **[ADAPT]**.
2. Replace the placeholder in `scripts/check-leaks.mjs` with the addresses this
   project is allowed to publish. Leaving the placeholder means any real
   address fails the gate, which is the safe default.
3. Keep `scripts/check-copy.mjs` if the audience is Spanish-speaking; delete it
   otherwise.
4. Write `docs/adr/0001-stack.md` from `docs/adr/0000-template.md`, with the
   alternatives you rejected.
5. Point the scripts at the project's real directories:

   ```bash
   node scripts/check-copy.mjs app src content
   node scripts/check-leaks.mjs dist public
   ```

6. Add the release command to `package.json` (or the equivalent for your
   build), with every gate in order. The template intentionally does not guess
   your build:

   ```json
   {
     "scripts": {
       "check:copy": "node scripts/check-copy.mjs src",
       "check:leaks": "node scripts/check-leaks.mjs dist public",
       "release": "npm run check:copy && npm run build && npm run check:leaks"
     }
   }
   ```

7. Write the deploy runbook and record the rollback path (`docs/deploy-checklist.md`).
8. Deploy to staging, verify, promote, verify live, and confirm contact still
   works.

The full checklist is §14 of the standards.

## What is included

| Path | Purpose |
|---|---|
| `docs/PROJECT_STANDARDS.md` | The contract. Copy it, adapt the **[ADAPT]** sections. |
| `AGENTS.md` | Short entry point so an agent reads the standards before working. |
| `docs/adr/0000-template.md` | ADR skeleton: context, decision, consequences, rejected alternatives. |
| `scripts/check-copy.mjs` | Closed-list lint against voseo and Rioplatense Spanish. |
| `scripts/check-leaks.mjs` | Allowlist scan of the build for emails, phone-like strings and image metadata. |
| `package.json` | Minimal scripts so the gates run with `npm run`. |

## What is not included, and why

- **Application code, framework, build pipeline.** That is ADR 0001.
- **`verify-deploy.mjs`.** It encodes routes, assets and redirects, which are
  per project. Copy it from a project that has one and adapt it; do not invent
  a generic version that pretends to know your URLs.
- **A deploy runbook.** The host, the config file and the rollback path differ
  per project. The structure is described in §10 of the standards.

## Using this repository as a reference

This template is the canonical copy of the standard. A project is an
implementation of it. If a project needs a rule change, change it here first
and then propagate it; otherwise every repository drifts into its own standard.
