# test-ruleset-github

A small Next.js 16 app (TypeScript, Tailwind, ESLint, Vitest) used as a playground for **GitHub rulesets** and **GitHub Actions CI**.

## Local commands

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start dev server on :3000       |
| `npm run lint`      | ESLint                          |
| `npm run typecheck` | TypeScript check (`tsc`)        |
| `npm test`          | Unit tests (Vitest)             |
| `npm run build`     | Production build                |

## CI

`.github/workflows/ci.yml` runs on every push to `main`, every PR into `main`, and manually (`workflow_dispatch`).

Jobs: `lint`, `typecheck`, `test` run in parallel, then `build` runs after all three pass.

## Code scanning: Semgrep Community Edition

`.github/workflows/semgrep.yml` runs Semgrep CE (free, no account or token) on pushes to `main` and on PRs, and uploads SARIF to **Security → Code scanning**.

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

## Ruleset experiments to try

Settings → Rules → Rulesets → **New branch ruleset**, target `main` (Default branch):

1. **Require a pull request before merging**: then try `git push origin main` directly and watch it get rejected.
2. **Require status checks to pass**: add `lint`, `typecheck`, `test`, `build` (they appear after CI has run once).
3. **Block force pushes** and **Restrict deletions**.
4. **Require linear history**: only squash/rebase merges allowed.
5. **Bypass list**: add yourself as a bypass actor and compare behaviour.
6. Set enforcement to **Evaluate** first to see what *would* be blocked (Insights → Rule insights).

### Ways to make CI fail on purpose

- Lint: add `const unused = 1;` in a file.
- Typecheck: `const n: number = "x";`
- Test: change `expect(add(2, 3)).toBe(5)` to `toBe(6)` in `src/lib/math.test.ts`.
- Build: import a module that doesn't exist.

Open a PR with one of these and see the merge button blocked by the ruleset.
