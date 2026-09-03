# Dependency audit status

Audit date: 2026-09-03 (npm registry audit).

| Workspace | Before safe updates | After safe updates | Decision |
| --- | ---: | ---: | --- |
| `frontend/` | 21 (2 low, 5 moderate, 14 high) | 0 | `npm audit fix` completed without `--force`; tests, lint, and build pass. |
| `backend/` | 25 (4 low, 4 moderate, 16 high, 1 critical) | 9 (2 low, 1 moderate, 5 high, 1 critical) | Safe compatible updates applied; remaining fixes are major-version upgrades. |

The remaining backend chain is not ignored: `sqlite3@5.1.7` pulls `node-gyp`,
`make-fetch-happen`, `cacache`, and vulnerable `tar`/`http-proxy-agent` packages;
npm offers `sqlite3@6` as the remediation and marks it breaking. The direct
`geoip-lite@1.x` dependency also pulls the remaining `ip-address` finding; npm
offers `geoip-lite@2` as breaking. FarmEase did not use `npm audit fix --force`.

These are install/build-time transitive risks rather than a justification to
ignore them. A dedicated compatibility PR should upgrade `sqlite3` and
`geoip-lite`, test all supported database modes on Node 20, and reassess whether
the GeoIP dependency is necessary. Until then, CI continues to install from the
locked dependency graph and no audit step is falsely reported as clean.
