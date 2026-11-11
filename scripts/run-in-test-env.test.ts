// @vitest-environment node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts/run-in-test-env.sh');

const toolchainProbe = `
node_bin=$(command -v node) || exit 1
npm_bin=$(command -v npm) || exit 1
printf '%s\\n' "$node_bin" "$npm_bin" "$PATH" "\${npm_config_prefix-}" "\${NPM_CONFIG_PREFIX-}"
`;

function hostEnv(overrides: Readonly<Record<string, string | undefined>>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, RUN_TESTS_IN_CONTAINER: '0' };
  delete env.TDBOOK_INSIDE_TEST_CONTAINER;
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
  return env;
}

function run(args: readonly string[], env: NodeJS.ProcessEnv) {
  return spawnSync(script, [...args], { encoding: 'utf8', env });
}

function commandPath(bin: 'node' | 'npm', env: NodeJS.ProcessEnv): string {
  const found = spawnSync('bash', ['-c', `command -v ${bin}`], { encoding: 'utf8', env });
  expect(found.status).toBe(0);
  return found.stdout.trim();
}

function probeLines(stdout: string): string[] {
  const lines = stdout.split('\n');
  if (lines.at(-1) === '') {
    lines.pop();
  }
  return lines;
}

describe('run-in-test-env host init', () => {
  it('keeps the current node and npm when npm_config_prefix is set', () => {
    const env = hostEnv({
      npm_config_prefix: '/',
      NPM_CONFIG_PREFIX: '/',
    });
    const result = run(['bash', '-lc', toolchainProbe], env);

    expect(result.status).toBe(0);
    const [nodeLine, npmLine, pathLine, prefixLine, prefixUpper] = probeLines(result.stdout);
    expect(nodeLine).toBe(commandPath('node', env));
    expect(npmLine).toBe(commandPath('npm', env));
    expect(pathLine).toBe(env.PATH);
    expect(prefixLine).toBe('/');
    expect(prefixUpper).toBe('/');
    expect(result.stderr).not.toContain('not compatible');
  });

  it('keeps the current node and npm when the prefix is unset', () => {
    const env = hostEnv({
      npm_config_prefix: undefined,
      NPM_CONFIG_PREFIX: undefined,
    });
    const result = run(['bash', '-lc', toolchainProbe], env);

    expect(result.status).toBe(0);
    const [nodeLine, npmLine, pathLine, prefixLine, prefixUpper] = probeLines(result.stdout);
    expect(nodeLine).toBe(commandPath('node', env));
    expect(npmLine).toBe(commandPath('npm', env));
    expect(pathLine).toBe(env.PATH);
    expect(prefixLine).toBe('');
    expect(prefixUpper).toBe('');
  });

  it('propagates the command exit status', () => {
    const prefixed = hostEnv({
      npm_config_prefix: '/',
      NPM_CONFIG_PREFIX: '/',
    });
    const clean = hostEnv({
      npm_config_prefix: undefined,
      NPM_CONFIG_PREFIX: undefined,
    });

    expect(run(['bash', '-lc', 'exit 17'], prefixed).status).toBe(17);
    expect(run(['bash', '-lc', 'exit 19'], clean).status).toBe(19);
    expect(run(['bash', '-c', 'exit 23'], clean).status).toBe(23);
  });
});
