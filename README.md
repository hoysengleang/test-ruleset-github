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
