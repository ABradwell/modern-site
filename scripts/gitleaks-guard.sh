#!/bin/sh
#
# Refuse any commit whose staged content looks like a secret.
#
# The scan is staged-only, which is both the fast option and the correct one:
# the index is exactly what the commit will carry, so ignored build output and
# untracked scratch files cannot produce findings. A full-history scan belongs
# in CI, not in front of every commit.
#
# This fails closed. With gitleaks missing the commit is refused rather than
# waved through unchecked, because a secret gate that silently stops working is
# worse than no gate: you stop watching for the mistake it was meant to catch.

set -eu

if ! command -v gitleaks >/dev/null 2>&1; then
  cat >&2 <<'MSG'
Refusing to commit: gitleaks is not installed.

  Every commit here is scanned for secrets. Install it:

      brew install gitleaks

MSG
  exit 1
fi

# --redact keeps the matched secret out of terminal scrollback; -v still prints
# the file, line and fingerprint, which is what you need to act on a finding.
if ! gitleaks git --staged --redact --no-banner -v; then
  cat >&2 <<'MSG'
  Staged content matched a secret pattern, so the commit was refused.

  If it is a real credential: unstage it, rotate it, then commit.
  If it is a false positive, either

      append  gitleaks:allow  as a comment on the offending line, or
      add the Fingerprint shown above to .gitleaksignore

MSG
  exit 1
fi
