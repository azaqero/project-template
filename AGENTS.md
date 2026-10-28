# Agent instructions

Before any work in this repository, read and follow
[`docs/PROJECT_STANDARDS.md`](docs/PROJECT_STANDARDS.md).

Non-negotiables that are easy to break by accident:

- User-facing Spanish is neutral Latin American Spanish. No voseo, no
  Rioplatense idioms. Run `npm run check:copy` before claiming copy is done.
- No private data in source, build output or commits. Run
  `npm run check:leaks` against the artifact, not just the source.
- Generated artifacts are regenerated from source, never hand-edited.
- Conventional commits, no AI attribution, one concern per commit.
- Significant decisions go to `docs/adr/` before the code, with the rejected
  alternatives listed.
- Do not claim a check passed without running it. If a tool is unavailable,
  say so instead of inferring a result.

When a task is ambiguous, ask one focused question and stop.
