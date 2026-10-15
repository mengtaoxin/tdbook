import { defineConfig } from 'oxfmt';
import fmt from '@mengtaoxin/oxc-config/fmt';

export default defineConfig({
  ...fmt,
  ignorePatterns: [
    ...(fmt.ignorePatterns ?? []),
    'coverage/',
    'src/routeTree.gen.ts',
    // Installed by `npx skills`; must stay byte-identical to skills-lock.json.
    '.agents/',
  ],
});
