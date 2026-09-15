<script setup lang="ts">
import { RouterLink } from 'vue-router'

const exampleJson = `{
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
      "title": "示例 PDF",
      "type": "pdf",
      "path": "https://example.com/books/sample.pdf"
    }
  ]
}`

const fields = [
  {
    name: 'id',
    required: true,
    description:
      '图书唯一标识，也是阅读页路由 /book/:id 的参数。须为非空字符串，不能包含 /、\\ 或 ..。重复的 id 只保留第一次出现的条目。',
  },
  {
    name: 'title',
    required: true,
    description: '显示标题，可与其他书重复。',
  },
  {
    name: 'author',
    required: false,
    description: '作者。可省略或填空字符串。',
  },
  {
    name: 'type',
    required: false,
    description: '格式：epub 或 pdf。省略时按 epub 处理。',
  },
  {
    name: 'path',
    required: true,
    description:
      '图书文件地址。须为 http(s)://… 远程链接，或站点绝对路径 /…（例如放在 public/ 下）。不支持相对路径、//… 或本地文件系统路径。',
  },
  {
    name: 'hover',
    required: false,
    description:
      '封面图地址，规则与 path 相同。设置后会覆盖从 EPUB/PDF 内提取的封面，用于图书列表展示。',
  },
] as const
</script>

<template>
  <v-container class="py-8" style="max-width: 720px">
    <h1 class="text-h5 mb-2">配置说明</h1>
    <p class="text-body-medium text-medium-emphasis mb-8">
      tdbook 的书目来自一份 JSON 配置文件（默认
      <code>/configs.json</code>）。把文件放到可访问的地址后，在「设置」里填写该地址即可使用自己的书单。
    </p>

    <h2 class="text-h6 mb-3">使用步骤</h2>
    <ol class="text-body-medium mb-8 pl-4">
      <li class="mb-2">
        按下方格式编写
        <code>configs.json</code>，把 EPUB / PDF 放到静态站点、对象存储或任意可公开访问的 URL。
      </li>
      <li class="mb-2">
        打开
        <RouterLink :to="{ name: 'settings' }" class="text-primary">
          设置
        </RouterLink>
        ，将「图书配置文件地址」改为你的
        <code>configs.json</code> 地址（例如
        <code>https://example.com/configs.json</code>），然后保存。
      </li>
      <li>
        回到
        <RouterLink :to="{ name: 'books' }" class="text-primary">
          图书列表
        </RouterLink>
        刷新查看。首次打开某本书时会下载到本机 IndexedDB，之后可离线阅读。
      </li>
    </ol>

    <h2 class="text-h6 mb-3">文件结构</h2>
    <p class="text-body-medium text-medium-emphasis mb-3">
      根对象包含
      <code>books</code> 数组，每一项描述一本书：
    </p>
    <v-table density="comfortable" class="mb-8 field-table">
      <thead>
        <tr>
          <th>字段</th>
          <th>必填</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="field in fields" :key="field.name">
          <td>
            <code>{{ field.name }}</code>
          </td>
          <td>{{ field.required ? '是' : '否' }}</td>
          <td class="text-medium-emphasis">{{ field.description }}</td>
        </tr>
      </tbody>
    </v-table>

    <h2 class="text-h6 mb-3">示例</h2>
    <pre class="example-json mb-8">{{ exampleJson }}</pre>

    <h2 class="text-h6 mb-3">注意事项</h2>
    <ul class="text-body-medium text-medium-emphasis pl-4 mb-0">
      <li class="mb-2">
        无效条目（缺 id、非法 path、未知 type 等）会被静默忽略，不会出现在列表中。
      </li>
      <li class="mb-2">
        若存在重复
        <code>id</code>，列表页会提示，且只保留第一次出现的书。
      </li>
      <li class="mb-2">
        跨域托管配置或图书文件时，服务器需允许浏览器跨域读取（CORS）。
      </li>
      <li>
        更换配置地址或书目后，已缓存的旧书不会自动删除；可在设置中「清除全部缓存」。
      </li>
    </ul>
  </v-container>
</template>

<style scoped>
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875em;
}

.example-json {
  margin: 0;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.55;
  white-space: pre;
}

.field-table :deep(td),
.field-table :deep(th) {
  vertical-align: top;
}
</style>
