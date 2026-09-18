# configs.json 指南

本页说明如何为 tdbook 编写 `configs.json` 书目配置文件。

tdbook 的书目来自一份 JSON 配置文件（默认 `/configs.json`）。把文件放到可访问的地址后，在「设置」里填写该地址即可使用自己的书单。

## 使用步骤

1. 按下方格式编写 `configs.json`，把 EPUB / PDF 放到静态站点、对象存储或任意可公开访问的 URL。
2. 打开「设置」，将「图书配置文件地址」改为你的 `configs.json` 地址（例如 `https://example.com/configs.json`），然后保存。
3. 回到「图书列表」刷新查看。首次打开某本书时会下载到本机 IndexedDB，之后可离线阅读。

## books

根对象包含 `books` 数组，每一项描述一本书。

- `id` — 图书唯一标识，也是阅读页路由 `/book/:id` 的参数（必填）。须为非空字符串，不能包含 `/`、`\` 或 `..`。推荐用小写字母与中横线拼接（如 `my-book-title`）。重复的 id 只保留第一次出现的条目。
- `title` — 显示标题，可与其他书重复（必填）
- `author` — 作者；可省略或填空字符串（可选）
- `type` — 格式：`epub` 或 `pdf`。省略时按 `epub` 处理（可选）
- `path` — 图书文件地址（必填）。须为 `http(s)://…` 远程链接，或站点绝对路径 `/…`（例如放在 `public/` 下）。不支持相对路径、`//…` 或本地文件系统路径。
- `hover` — 封面图地址，规则与 `path` 相同（可选）。设置后会覆盖从 EPUB/PDF 内提取的封面，用于图书列表展示。

## 示例

```json
{
  "books": [
    {
      "id": "alices-adventures-in-wonderland",
      "title": "Alice's Adventures in Wonderland",
      "author": "Lewis Carroll",
      "type": "epub",
      "path": "/sample.epub",
      "hover": "/sample.jpg"
    },
    {
      "id": "sample-pdf",
      "title": "Sample PDF",
      "type": "pdf",
      "path": "https://example.com/books/sample.pdf"
    }
  ]
}
```

## 注意事项

- 无效条目（缺 id、非法 path、未知 type 等）会被静默忽略，不会出现在列表中。
- 若存在重复 `id`，列表页会提示，且只保留第一次出现的书。
- 跨域托管配置或图书文件时，服务器需允许浏览器跨域读取（CORS）。
- 更换配置地址或书目后，已缓存的旧书不会自动删除；可在设置中「清除全部缓存」。

## 让大模型生成 configs.json

把下面的提示词复制到 ChatGPT、Claude 等大模型。把电子书库地址换成你自己的，再把返回的 JSON 用作 `configs.json`（或放到可访问地址，并在设置里填写图书配置文件地址）。

```
遵循网站（https://tdbook.smt.sh/config-guide）的要求，为我的电子书库（http://example.com/ebook-library）生成 configs.json。
```
