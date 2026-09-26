# 修改代码的步骤

改行为、修 bug、补回归保护时，按下面顺序做。约定见 [conventions.md](./conventions.md)，目录结构见 [file-structure.md](./file-structure.md)，数据模型见 [AGENTS.md](../AGENTS.md)；命令以仓库根目录 `package.json` 为准，不要新增 `scripts/*.sh`。

## 顺序

1. 用一句话写清**可观察行为**（用户或调用方能看到的结果），不是实现细节。
2. **检查代码结构**：改动应落在现有分层里，而不是就近塞进任意文件。
3. **TDD**：先写失败测试（Red），再写最少实现（Green），最后在测试保持通过时整理（Refactor）。
4. 跑相关测试，结束前再跑完整单元测试；触及阅读器 / 缓存时还要跑 e2e。
5. **Format**：对齐邻近文件风格。
6. **Check**：类型检查 + 生产构建必须通过。
7. 按变更类型做手工核对（书目、阅读器、缓存）。

不要先写实现再补一个已经变绿的测试。那不是本仓库要求的 TDD。

## 1. 明确行为

- 一句话描述期望结果，例如：「重复 `id` 时列表展示错误提示，并只保留首次出现的条目」。
- 还写不清测试该断言什么时，先停下来澄清需求，不要凭猜测堆生产代码。
- 纯文档 / 注释 / 无行为变化的格式调整：不要求新测试；下面的手工核对也可跳过。

## 2. 检查代码结构

动手前先对照 [file-structure.md](./file-structure.md) 与 [conventions.md](./conventions.md)，确认文件该放哪、该不该新建。

| 职责 | 放哪里 |
| ---- | ------ |
| 书目、缓存、EPUB/PDF 解析与 I/O | `src/lib/` |
| 页面与路由 | `src/routes/` |
| 可复用 UI | `src/components/` |
| 跨页偏好、书目列表缓存 | `src/stores/`（Zustand） |
| 阅读会话 / 当前页 | `src/hooks/`；页码留在 URL `?page=` |
| 界面文案 | `src/i18n/locales/en.ts` 与 `zh.ts` 同时改 |
| Config Guide 正文 | `public/how-to-write-config-file*.md` |
| 单元测试 | 与被测模块同目录的 `*.test.ts`（如 `src/lib/paths.test.ts`） |
| 端到端测试 | `e2e/*.spec.ts` |
| 书目条目 | `configs.json`（独立 `id`，不要把书名写死在应用里） |

检查问题：

- 新逻辑是否已有同类模块（适配器、缓存、目录规范化）可扩展，而不是平行再写一套？
- 路由/组件是否掺进了本该在 `src/lib/` 的解析或 I/O？
- 导入是否用 `@/`，缩进是否 2 空格，是否与邻近文件一致？
- 是否动到了不该提交的 `dist/`、`node_modules/`、密钥？

结构不对时，先挪到正确位置再写测试与实现。

## 3. TDD（Red → Green → Refactor）

行为变更（功能、修 bug、回归保护）必须走这一轮：

1. **Red**：在能锁住该行为的**最低层**补测试。先跑，确认是因为行为缺失/结果不对而失败，而不是编译错误、错误 import 或脆弱的 setup。
2. **Green**：只改刚好让该测试通过的生产代码。这一步不做顺手重构。
3. **Refactor**：在测试保持绿色时整理结构与命名。

层选择：

- 纯函数、规范化、缓存契约 → 与源文件同目录的 `*.test.ts`（Vitest）。
- 用户可见的打开书籍、翻页、清缓存等集成路径 → 在单元覆盖之上，用 `e2e/`（Playwright）做冒烟，不要用 e2e 替代对纯辅助函数的单元测试。
- 不要在 e2e 里重复单元测试已经锁死的断言，除非需要一条集成冒烟。

例外（不是跳过行为测试的借口）：

- 无行为变化的文档 / 注释 / 纯格式：不需要新测试。
- 机械性移动（重命名、整理 import）且行为不变：不需要新测试，结束前仍应跑完整单元测试。
- 试探性代码可以暂时不做 TDD，但留下之前必须用 Red→Green 重做或删掉。

## 4. 测试

```sh
npm run test                         # 全部单元测试（Vitest）
npm run test -- src/lib/foo.test.ts  # 单个文件（Red/Green 时用）
npm run test:coverage                # 单元测试 + V8 覆盖率（终端摘要 + coverage/）
npm run test:e2e                     # Playwright Chromium（使用 public/testdata 夹具）
```

- 每个 Red / Green 步骤都跑当前相关测试。
- 结束前必须 `npm run test` 全绿；只跑单个文件不算完成。
- 改了阅读器、缓存、格式适配器时，再跑 `npm run test:e2e`。若本机没有浏览器：`npx playwright install chromium`。
- 新单元测试与被测模块同目录，命名 `*.test.ts`（如 `src/lib/paths.test.ts`），风格对齐邻近用例；共享 setup 在 `src/test/setup.ts`。
- e2e 夹具在 `public/testdata/`（已提交）；需要时就地改文件，不要新增生成脚本。

## 5. Format

本仓库目前没有独立的 `format` / Prettier / ESLint 脚本。不要为了格式化去加 `scripts/*.sh`。

- 与邻近文件保持一致：2 空格缩进、TypeScript、React 函数组件、`@/` 导入。
- 优先 MUI 组件与 `sx` / theme tokens；不要引入 Vue、Vuetify、Pinia、Tailwind。
- 新的界面字符串必须同时有 en / zh。

若日后在 `package.json` 增加了 `format`，把「写盘格式化」写进本小节，并在 Check 里加上对应的 check-only 命令。

## 6. Check

```sh
npm run build    # tsc -b 类型检查 + Vite 生产构建
```

TypeScript 或 React 有改动时，结束前必须 `npm run build` 通过。本仓库没有单独的 `lint` / `check` 脚本；类型与打包门禁就是 `build`。

不要把 `build` 失败理解成「测试红了」：TDD 的 Red 必须是断言失败，而不是 `tsc` 挂掉。

## 7. 手工核对

自动化过了之后，按改动面补手工路径（`npm run dev`，默认 http://localhost:3000）：

- **只改书目 `configs.json`**：打开 `/books`，确认新书出现且能打开。
- **改缓存或阅读器**：EPUB 与 PDF 都要能打开、翻页；Settings 里「Clear all cache」后再打开仍正常。
- **改导航 / 设置 / i18n**：相关路由点一遍，并切换 en / zh，确认文案与状态一致。

## 完成前清单

- [ ] 行为一句话说清，文件位置符合分层。
- [ ] 有行为变化时：见过 Red，再 Green，需要时 Refactor。
- [ ] `npm run test` 通过；阅读器/缓存变更另有 `npm run test:e2e`。
- [ ] 风格与邻近代码一致；en / zh 文案成对。
- [ ] `npm run build` 通过。
- [ ] 需要时做完对应手工路径。
- [ ] 契约或文档化行为变了，才改文档；步骤本身只维护在本文件。
