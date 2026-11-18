# test-ruleset-github

A small Next.js 16 app (TypeScript, Tailwind, ESLint, Vitest) used as a playground for **GitHub rulesets** and **GitHub Actions CI**.

## Local commands

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start dev server on :3000       |
| `npm run lint`      | ESLint                          |
| `npm run typecheck` | TypeScript check (`tsc`)        |
| `npm test`          | All tests (unit + business)     |
| `npm run test:unit` | Unit tests only                 |
| `npm run test:business` | Business-rule tests only    |
| `npm run test:coverage` | Unit tests with a coverage table (all of `src/`) |
| `npm run test:business:coverage` | Business tests with a coverage table (controllers and services only) |
| `npm run test:business:check` | Flag changed controllers/services that no business test runs |
| `npm run build`     | Production build                |

## Tests: where they live and where they run

```
src/
  app/                       UI (pages, layouts): no business logic here
  lib/
    *.controller.ts          business entry points
    *.service.ts             business logic
    *.ts                     helpers (e.g. math.ts)
tests/
  unit/                      unit tests
  business/                  business tests
```

| Kind | Lives in | What it checks | Coverage measured on | Run locally | Runs in CI |
| --- | --- | --- | --- | --- | --- |
| Unit | `tests/unit/**/*.test.ts` | Code details (summing, rounding, errors) | All of `src/` | `npm run test:unit` | `test` job |
| Business | `tests/business/**/*.business.test.ts` | Rules the business agreed on, e.g. "10% off orders of $100 or more" | Only `src/**/*.controller.ts` and `src/**/*.service.ts` | `npm run test:business` | `business-test` job |

Coverage is reported in both jobs but not enforced yet.

All business logic lives in controllers and services, so business coverage leaves out the UI (`src/app/`) and helpers. To change which files count as business code, edit the `--coverage.include` pattern in the `test:business:coverage` script in `package.json`. The check below uses the same pattern.

Both CI jobs run on every PR into `main` and every push to `main`. Each one shows up as its own status check, so a ruleset can require `business-test` on its own.

A new business rule goes in `tests/business/<area>.business.test.ts`, with the rule written in the `describe`/`it` names (see `tests/business/pricing.business.test.ts`).

Write business tests against the entry point developers actually change, such as a controller (see `tests/business/checkout.business.test.ts`). Then wrong logic anywhere on that path fails the test.

### "Is my change in a business test?" check

A business test only catches wrong logic in code it actually runs. On every PR, the `business-test` job also runs `npm run test:business:check`:

1. It runs the business tests and measures coverage for **only the files the PR changed**.
2. A changed controller or service that **no business test runs at all** gets a warning on the PR: *"Not in any business test"*.
3. For now it only warns. Setting `BUSINESS_COVERAGE_STRICT: "true"` in `ci.yml` makes it fail the job, so the ruleset blocks the merge.

Changed files that aren't controllers or services (UI, helpers, config, styles) are never checked, so a syntax or typo fix there is never flagged.

## CI

`.github/workflows/ci.yml` runs on every push to `main`, every PR into `main`, and manually (`workflow_dispatch`).

Jobs: `lint`, `typecheck`, `test`, `business-test` run in parallel. `build` runs after `lint` and `typecheck` pass. It doesn't wait for the test jobs, so requiring `build` doesn't secretly require tests too.

## Code scanning: Semgrep Community Edition (parked)

> **Status: parked.** Uploading results to Code scanning on a private org repo needs a paid GitHub Code Security licence. Until the org buys one, `semgrep.yml` only runs manually (`workflow_dispatch`), and the ruleset does **not** use *Require code scanning results*. To turn it back on, add the `push` / `pull_request` triggers again (see the comment in the workflow).

When enabled, `.github/workflows/semgrep.yml` runs Semgrep CE (free, no account or token) on pushes to `main` and on PRs, and uploads SARIF to **Security → Code scanning**.

- Rulesets: `p/javascript`, `p/typescript`, `p/react`, `p/secrets`
- Tool name to use in the ruleset: **`Semgrep OSS`**
- Semgrep CE results have no `security-severity`, only a level (error / warning / note). In the ruleset, use the **Alerts** threshold (e.g. *Errors and warnings*). The *Security alerts* threshold won't catch them.

Run it locally:

```bash
pip install semgrep
semgrep scan --config p/javascript --config p/typescript --config p/react --config p/secrets --metrics=off
```

Patterns it catches (checked locally):

| Code | Rule | Level |
| --- | --- | --- |
| `<div dangerouslySetInnerHTML={{ __html: html }} />` | `react-dangerouslysetinnerhtml` | warning |
| Express `res.send("<h1>" + req.query.name + "</h1>")` | `raw-html-format`, `direct-response-write` | warning |
| Express `eval("..." + req.query.x)` | `code-string-concat` | error |

Note: Semgrep CE does not trace input through Next.js `Request` objects in route handlers, so `eval(searchParams.get(...))` in `app/**/route.ts` is **not** flagged. That's a good reason to also enable CodeQL.

## Pushing to GitHub

```bash
git remote add origin git@github.com:<you>/test-ruleset-github.git
git push -u origin main
```

## Block merges when unit or business tests fail

`.github/rulesets/main-require-tests.json` is a ready-made ruleset. It makes `test` (unit) and `business-test` required status checks on `main`, so a PR can't be merged while either one is failing or still running.

GitHub doesn't apply this file by itself. Import it once:

1. Push the branch so CI has run at least once with both jobs.
2. On GitHub: **Settings → Rules → Rulesets → New ruleset → Import a ruleset**, then choose `main-require-tests.json`.
3. Check the settings, then click **Create**.

What the file sets:

| Setting | Value | Why |
| --- | --- | --- |
| Target | Default branch (`main`) | |
| Enforcement | Active | Blocks right away. Change it to *Evaluate* when importing if you'd rather watch first. |
| Required checks | `test`, `business-test` | Unit and business tests. Lint/typecheck/build aren't required yet. |
| Require branches to be up to date | Off | Developers don't have to keep rebasing their PR on `main`. |
| Bypass list | Empty | Add admins or a lead here if someone must be able to merge in an emergency. |

Two things to know:
- Required checks also apply to **direct pushes** to `main`. A push is rejected unless its commit already passed both checks on another branch, so changes effectively go through a PR.
- The "Not in any business test" step only warns, so it doesn't block. Only failing tests block.

## Rollout plan: one step at a time

Most developers don't write tests yet, so rules go on gradually. Nothing asks a developer to write a test until phase 5. Each phase starts in **Evaluate** mode (nothing is blocked; check Insights → Rule insights for what *would* fail), then moves to **Active** once the team is ready.

| Phase | Rules on `main` | What developers must do | Who writes tests |
| --- | --- | --- | --- |
| 0 (now) | No rules. CI runs on every PR and only reports. | Nothing new | Lead / QA starts adding business tests |
| 1 | Block force pushes, Restrict deletions | Don't rewrite or delete `main` | Lead / QA |
| 2 | Require a pull request before merging | Open a PR instead of pushing to `main` | Lead / QA |
| 3 | Require status checks: `lint`, `typecheck`, `build` | Code must lint, type-check and build | Lead / QA |
| 4 | Also require `test`, `business-test` | Don't break the tests that **already exist**. No new tests needed. The "not in any business test" check only warns. | Lead / QA |
| 5 | Set `BUSINESS_COVERAGE_STRICT: "true"`. Optionally add a coverage minimum in `vitest.config.ts`. | A changed business file must be run by at least one business test | Everyone |
| Later | Require code scanning results (Semgrep / CodeQL) | Fix flagged security issues | — |

Notes:
- Requiring `test` / `business-test` (phase 4) does **not** force anyone to write tests. It only stops a PR from breaking tests that are already there. Strict mode (phase 5) is the first thing that asks for new tests, and only for changed business files.
- Business tests are the best place to start. A few tests on the most important rules (pricing, payments, permissions) protect the most with the least effort, and the lead or QA can write them without changing how developers work.
- Code scanning on private repos needs paid GitHub Code Security, so it waits until the org buys it.

## Ruleset experiments to try

Settings → Rules → Rulesets → **New branch ruleset**, target `main` (Default branch):

1. **Require a pull request before merging**: then try `git push origin main` directly and watch it get rejected.
2. **Require status checks to pass**: add `lint`, `typecheck`, `test`, `business-test`, `build` (they appear after CI has run once).
3. **Block force pushes** and **Restrict deletions**.
4. **Require linear history**: only squash/rebase merges allowed.
5. **Bypass list**: add yourself as a bypass actor and compare behaviour.
6. Set enforcement to **Evaluate** first to see what *would* be blocked (Insights → Rule insights).

### Ways to make CI fail on purpose

- Lint: add `const unused = 1;` in a file.
- Typecheck: `const n: number = "x";`
- Test: change `expect(add(2, 3)).toBe(5)` to `toBe(6)` in `tests/unit/math.test.ts`.
- Business test: change `DISCOUNT_RATE` to `0.2` in `src/lib/pricing.service.ts`.
- Build: import a module that doesn't exist.

Open a PR with one of these and see the merge button blocked by the ruleset.
