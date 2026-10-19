# Removing uploaded files from Git history

## What the scan found (19 Oct 2026, all 44 commits, all branches)

- `portal-api/uploads/` was committed with 23 paths over time, about 190 MB:
  a candidate CV (`cv-ajmal-shafi_original-….pdf`), two PDFs, a PSD, MP4 videos and images.
- No other document types (pdf/doc/xls/zip/keys/env/db dumps) outside that folder,
  apart from the intentional QC/plan documents at the repo root.
- No credentials or keys in history (checked for AWS keys, MongoDB connection
  strings with passwords, private keys, Google/Stripe/Slack tokens).
- Since Phase A the folder is untracked and git-ignored; it still exists in older commits.

Decision: remove the whole `portal-api/uploads/` path from every commit, once.

## Impact

- Every commit hash from the first commit that added an upload onward changes
  (in practice: nearly the whole history). Branch names stay.
- Everyone must re-clone afterwards. An old clone pushed later would bring the files back.
- Open pull requests and links to old commit hashes stop working.
- GitHub may keep the old commits reachable by hash until its own cleanup; GitHub Support
  can be asked to purge cached views for sensitive data.
- Your working folder's untracked files (.env files, `server/`, local `uploads/`, `.claude/`,
  `.codex-artifacts/`) are not in Git and must be copied into the fresh clone.

## Procedure (run only after stabilize/phase-a is pushed)

```
# 0. Tool (once)
brew install git-filter-repo

# 1. Full backup of the remote, kept untouched
cd ~/Projects
git clone --mirror https://github.com/HassanAlhag/expresso-portal.git expresso-portal-BACKUP-2026-10.git

# 2. Rewrite in a separate mirror
git clone --mirror https://github.com/HassanAlhag/expresso-portal.git expresso-portal-rewrite.git
cd expresso-portal-rewrite.git
git filter-repo --invert-paths --path portal-api/uploads/

# 3. Verify before pushing
git log --all --oneline -- portal-api/uploads | wc -l        # must print 0
git rev-list --objects --all | grep -c "portal-api/uploads"  # must print 0
git count-objects -vH                                        # size-pack should drop

# 4. Publish (filter-repo removes the remote on purpose)
git remote add origin https://github.com/HassanAlhag/expresso-portal.git
git push --force --mirror origin

# 5. Replace your working copy
cd ~/Projects
mv Expresso-Internal Expresso-Internal-old
git clone https://github.com/HassanAlhag/expresso-portal.git Expresso-Internal
cp Expresso-Internal-old/portal-api/.env Expresso-Internal/portal-api/
cp Expresso-Internal-old/client/.env* Expresso-Internal/client/ 2>/dev/null
# copy any other local-only folders you still need (server/, .claude/), then:
cd Expresso-Internal/portal-api && npm ci && npm test
```

Keep `expresso-portal-BACKUP-2026-10.git` offline until you are satisfied, then delete it
(it still contains the CV).
