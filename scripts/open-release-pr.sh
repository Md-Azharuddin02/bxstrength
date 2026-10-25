#!/usr/bin/env bash
# Open or update the staging -> main release PR after staging validation passes.
# Never merges. Idempotent: reuses the existing open PR instead of creating duplicates.
# Requires GH_TOKEN (set by the workflow) and the gh CLI (present on GitHub runners).
set -euo pipefail

SHA="${GITHUB_SHA:?GITHUB_SHA required}"
RUN_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:?}/actions/runs/${GITHUB_RUN_ID:?}"

read -r -d '' BODY <<EOF || true
Release candidate promoted from **staging**.

- **Tested commit:** \`${SHA}\`
- **Staging validation:** deploy confirmed + smoke tests passed ([run](${RUN_URL}))

Review the diff and **merge manually** to release to production. CI and production
validation run again on the resulting \`main\` commit.
EOF

existing="$(gh pr list --base main --head staging --state open --json number --jq '.[0].number // empty')"

if [ -n "${existing}" ]; then
  gh pr edit "${existing}" --title "Release: staging → main (${SHA:0:7})" --body "${BODY}"
  echo "Updated release PR #${existing}"
else
  gh pr create --base main --head staging --title "Release: staging → main (${SHA:0:7})" --body "${BODY}"
  echo "Opened release PR staging → main"
fi
