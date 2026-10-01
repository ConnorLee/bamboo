import { execFileSync } from 'node:child_process';

// Vercel's ignoreCommand uses 0 to skip and 1 to build. Fail open to a build.
// Compare the last successful deployment, not HEAD^: one push can contain
// a real source change followed by an archival release-record commit.
function shouldSkip() {
  const current = process.env.VERCEL_GIT_COMMIT_SHA;
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;
  const sha = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
  if (!sha.test(current || '') || !sha.test(previous || '')) return false;
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    if (git('rev-parse', 'HEAD').trim().toLowerCase() !== current.toLowerCase()) return false;
    const status = git('status', '--porcelain', '-z', '--untracked-files=no').split('\0').filter(Boolean);
    if (status.length) {
      // Vercel prunes upload-excluded files before this command runs. Only
      // unstaged deletions of those tracked files are an expected dirty state.
      const excluded = new Set(git('ls-files', '--cached', '--ignored', '--exclude-from=.vercelignore', '-z').split('\0').filter(Boolean));
      if (status.some(entry => !entry.startsWith(' D ') || !excluded.has(entry.slice(3)))) return false;
    }
    git('merge-base', '--is-ancestor', previous, current);
    // --no-renames keeps a source file moved into this directory visible as a deletion.
    const changed = git('diff', '--no-renames', '--name-only', '-z', previous, current, '--').split('\0').filter(Boolean);
    return changed.length > 0 && changed.every(file => /^provenance\/releases\/[^/]+\.json$/.test(file));
  } catch {
    // Vercel uses a shallow clone; an unavailable prior commit must never skip work.
    return false;
  }
}

const skip = shouldSkip();
console.log(skip ? 'Skipping build: only archived release records changed since the last successful deployment.' : 'Continuing build: source changes or insufficient Git history.');
process.exitCode = skip ? 0 : 1;
