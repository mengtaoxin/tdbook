import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'run-in-test-env.sh');

const homes: string[] = [];

afterEach(() => {
  for (const home of homes.splice(0)) {
    rmSync(home, { recursive: true, force: true });
  }
});

/**
 * Login profile stand-in for nvm: a prefix env outside nvm's tree makes nvm
 * deactivate, so npm is not on PATH. An empty PATH (not the system PATH) keeps
 * a distro npm from hiding that refusal.
 */
function makeHome(): string {
  const home = mkdtempSync(path.join(tmpdir(), 'tdbook-run-in-test-env-'));
  homes.push(home);
  const bin = path.join(home, 'bin');
  mkdirSync(bin);
  mkdirSync(path.join(home, 'empty'));
  const npmPath = path.join(bin, 'npm');
  writeFileSync(npmPath, '#!/bin/sh\necho npm-ok\n');
  chmodSync(npmPath, 0o755);
  writeFileSync(
    path.join(home, '.bash_profile'),
    [
      'if [ -n "${npm_config_prefix-}" ] || [ -n "${NPM_CONFIG_PREFIX-}" ]; then',
      '  echo "nvm is not compatible with the npm config prefix option: currently set to \\"${npm_config_prefix:-${NPM_CONFIG_PREFIX}}\\"" >&2',
      '  export PATH="${HOME}/empty"',
      'else',
      '  export PATH="${HOME}/bin"',
      'fi',
      '',
    ].join('\n'),
  );
  return home;
}

function run(
  args: readonly string[],
  extra: Readonly<Record<string, string>>,
): SpawnSyncReturns<string> {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: makeHome(),
    RUN_TESTS_IN_CONTAINER: '0',
  };
  delete env.TDBOOK_INSIDE_TEST_CONTAINER;
  delete env.npm_config_prefix;
  delete env.NPM_CONFIG_PREFIX;
  delete env.BASH_ENV;
  for (const [key, value] of Object.entries(extra)) {
    env[key] = value;
  }
  return spawnSync('bash', [scriptPath, ...args], {
    encoding: 'utf8',
    env,
  });
}

describe('run-in-test-env host login shell', () => {
  it('runs npm when npm_config_prefix is set', () => {
    const result = run(['bash', '-lc', 'command -v npm >/dev/null && npm'], {
      npm_config_prefix: '/',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('npm-ok');
    expect(result.stderr).not.toContain('not compatible');
  });

  it('runs npm when NPM_CONFIG_PREFIX is set', () => {
    const result = run(['bash', '-lc', 'command -v npm >/dev/null && npm'], {
      NPM_CONFIG_PREFIX: '/',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('npm-ok');
    expect(result.stderr).not.toContain('not compatible');
  });

  it('runs npm when no prefix env is set', () => {
    const result = run(['bash', '-lc', 'command -v npm >/dev/null && npm'], {});
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('npm-ok');
  });

  it('keeps unrelated npm config and the command exit code', () => {
    const seen = run(['bash', '-lc', 'printf %s "$npm_config_registry"'], {
      npm_config_prefix: '/',
      npm_config_registry: 'https://registry.example.test',
    });
    expect(seen.status).toBe(0);
    expect(seen.stdout).toBe('https://registry.example.test');

    expect(run(['bash', '-lc', 'exit 9'], { npm_config_prefix: '/' }).status).toBe(9);
    expect(run(['bash', '-lc', 'exit 9'], {}).status).toBe(9);
    expect(run(['bash', '-c', 'exit 4'], {}).status).toBe(4);
  });
});
