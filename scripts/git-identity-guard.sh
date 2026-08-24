#!/bin/sh
#
# The firm rule: every commit in this repository is authored by ABradwell.
#
# This is a personal repository on a personal GitHub account, but it is cloned on
# a machine whose global git identity is a work address. Without a gate, the
# global identity wins by default and the mistake is invisible: the commit lands,
# the name on it is still correct, and only the email is wrong. GitHub then
# attributes it to nobody, and the fix is a history rewrite plus a force push
# across every branch, which is what prompted this file.
#
# Two hooks call it, because they catch different mistakes:
#
#   pre-commit  checks the identity the commit is ABOUT to use. Fails before the
#               commit object exists, so nothing needs undoing.
#   pre-push    checks the identity commits ALREADY carry. Catches anything that
#               got in around pre-commit: --no-verify, a rebase, a cherry-pick
#               from a work repository, a commit made by a tool.
#
# The committer may also be GitHub itself, which signs the merge commits it
# creates when a pull request is merged in the web UI. Those are legitimate and
# unavoidable, so they are allowed as committer only. The author on them is
# already the account owner.

set -eu

ALLOWED_NAME='Aiden Stevenson Bradwell'
ALLOWED_EMAIL='aidenbradwell@gmail.com'
DISPLAY_EMAIL='Aidenbradwell@gmail.com'
GITHUB_MERGE_EMAIL='noreply@github.com'

# Emails are compared lowercased. Git preserves the case you type, GitHub does
# not care about it, so treating Aidenbradwell@ and aidenbradwell@ as different
# identities would fail commits that are in fact correct.
lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }

explain_fix() {
  cat >&2 <<MSG

  This repository accepts commits from one identity only:

      $ALLOWED_NAME <$DISPLAY_EMAIL>

  Set it for this clone (all worktrees share the config):

      git config --local user.name  "$ALLOWED_NAME"
      git config --local user.email "$DISPLAY_EMAIL"

  Then re-author what is already committed:

      git commit --amend --reset-author --no-edit    # the last commit
      git rebase -x 'git commit --amend --reset-author --no-edit' origin/main

MSG
}

# The identity a commit made right now would carry. `git var` is used rather
# than `git config` because it resolves the full precedence chain, including the
# GIT_AUTHOR_* environment variables that override config entirely.
check_pending() {
  failed=0
  for role in AUTHOR COMMITTER; do
    ident=$(git var "GIT_${role}_IDENT")
    name=$(printf '%s' "$ident" | sed -n 's/^\(.*\) <.*/\1/p')
    email=$(lower "$(printf '%s' "$ident" | sed -n 's/.*<\(.*\)>.*/\1/p')")

    if [ "$email" != "$ALLOWED_EMAIL" ] || [ "$name" != "$ALLOWED_NAME" ]; then
      printf 'Refusing to commit: %s identity is %s <%s>\n' \
        "$(lower "$role")" "$name" "$email" >&2
      failed=1
    fi
  done
  [ "$failed" -eq 0 ] || { explain_fix; exit 1; }
}

# Shared by the pre-push hook and by CI. Takes commit shas as arguments.
validate_revs() {
  failed=0
  for rev in "$@"; do
    entry=$(git log -1 --format='%an%x1f%ae%x1f%cn%x1f%ce' "$rev")
    an=$(printf '%s' "$entry" | cut -d"$(printf '\037')" -f1)
    ae=$(lower "$(printf '%s' "$entry" | cut -d"$(printf '\037')" -f2)")
    ce=$(lower "$(printf '%s' "$entry" | cut -d"$(printf '\037')" -f4)")

    if [ "$ae" != "$ALLOWED_EMAIL" ] || [ "$an" != "$ALLOWED_NAME" ]; then
      printf 'Rejecting %s: authored by %s <%s>\n' \
        "$(git rev-parse --short "$rev")" "$an" "$ae" >&2
      failed=1
    fi

    if [ "$ce" != "$ALLOWED_EMAIL" ] && [ "$ce" != "$GITHUB_MERGE_EMAIL" ]; then
      printf 'Rejecting %s: committed by <%s>\n' \
        "$(git rev-parse --short "$rev")" "$ce" >&2
      failed=1
    fi
  done
  [ "$failed" -eq 0 ] || { explain_fix; exit 1; }
}

# Every commit about to reach the remote. Reads the pre-push stdin protocol:
# one line per ref, "<local ref> <local sha> <remote ref> <remote sha>".
check_outgoing() {
  zero=$(git hash-object --stdin </dev/null | tr '0-9a-f' '0')
  revs=''

  while read -r _local_ref local_sha _remote_ref remote_sha; do
    # A deletion has no commits to inspect.
    [ "$local_sha" = "$zero" ] && continue

    if [ "$remote_sha" = "$zero" ]; then
      # New branch. Everything already on the remote either passed this gate or
      # predates it, so exclude it and check only what is genuinely new.
      revs="$revs $(git rev-list "$local_sha" --not --remotes=origin)"
    else
      revs="$revs $(git rev-list "$remote_sha..$local_sha")"
    fi
  done

  # Unquoted on purpose: the accumulated shas must split into arguments.
  # shellcheck disable=SC2086
  set -- $revs
  [ "$#" -eq 0 ] && return 0
  validate_revs "$@"
}

# Whatever a rev range resolves to. Used by CI, where the range comes from the
# event payload rather than from a hook's stdin.
check_range() {
  # shellcheck disable=SC2046
  set -- $(git rev-list "$@")
  [ "$#" -eq 0 ] && return 0
  validate_revs "$@"
}

case "${1:-}" in
  pending)  check_pending ;;
  outgoing) check_outgoing ;;
  range)    shift; check_range "$@" ;;
  *)
    echo "usage: $0 pending|outgoing|range <rev-range>" >&2
    exit 2
    ;;
esac
