# tdbook

[English](../README.md) | [中文](./README.zh-CN.md)

个人电子书浏览器：从 `configs.json` 拉取远程 EPUB / PDF 书目，首次打开时下载到浏览器 IndexedDB，之后可离线阅读。纯静态部署，无后端。

## 功能

- 书目列表与在线阅读器（EPUB / PDF）
- 按远程 URL 缓存整书；支持清除缓存后重新下载
- 书目以 `configs.json` 为唯一数据源，添加书籍只需改配置
- 可安装 PWA（生产构建）：应用壳与静态资源可离线；书籍内容仍存 IndexedDB

## 技术栈

- React 19 + Vite + TypeScript + TanStack Router + MUI 9 + Zustand + react-i18next
- PWA：`vite-plugin-pwa`（生产环境 Service Worker + Web App Manifest）
- EPUB：`jszip` + `fast-xml-parser`
- PDF：`pdfjs-dist`
- 书籍缓存：`dexie`（IndexedDB）

## 快速开始

```sh
npm install
npm run dev      # 开发：http://localhost:3000
```

打开 [http://localhost:3000](http://localhost:3000)。停止：Ctrl+C。

全部命令见 [commands.md](./commands.md)，测试说明见 [testing.md](./testing.md)。

## 添加书籍

在 `public/configs.json` 的 `books` 数组中追加条目：

```json
{
  "id": "unique-book-id",
  "title": "书名",
  "author": "作者（可选）",
  "type": "epub",
  "path": "https://example.com/book.epub"
}
```

| 字段     | 说明                                                                                          |
| -------- | --------------------------------------------------------------------------------------------- |
| `id`     | 路由标识，对应 `/book/:id`；不可含 `/`、`\`、`..`。若重复，保留首次出现的条目，列表会提示错误 |
| `title`  | 展示标题，可重复                                                                              |
| `author` | 可选                                                                                          |
| `type`   | `epub` 或 `pdf`（可省略，由扩展名推断）                                                       |
| `path`   | 远程 `http(s)://…`，或同源静态路径 `/…`（如 `public/` 下的文件）                              |
| `hover`  | 可选封面图，规则同 `path`；有则优先于从书内提取的封面                                         |

## 目录结构（简要）

```
public/configs.json  书目配置
src/views/       列表页、阅读页
src/lib/         书目加载、IndexedDB 缓存、EPUB/PDF 解析
```

更细的约定见 [conventions.md](./conventions.md)，目录结构见 [file-structure.md](./file-structure.md)，数据模型见 [AGENTS.md](../AGENTS.md)。

## 许可证

[MIT](../LICENSE)
