export default {
  nav: {
    home: '首页',
    books: '图书列表',
    settings: '设置',
    configGuide: '配置说明',
    about: '关于',
  },
  locale: {
    label: '语言',
    en: 'English',
    zh: '中文',
  },
  home: {
    tagline:
      '个人电子书阅读器：在浏览器里浏览书目、打开电子书或 PDF，第一次阅读时会下载到本机，之后即使没有网络也能继续读。',
    catalogHint:
      '书目由配置文件提供，如需更换书单来源，可在设置中修改配置地址。',
    browseBooks: '浏览图书列表',
    features: {
      formats: {
        title: '多种格式',
        description: '支持常见的电子书与 PDF，打开即可在网页里阅读。',
      },
      local: {
        title: '本机保存',
        description: '第一次打开时会自动下载到本机，之后无需反复加载。',
      },
      offline: {
        title: '离线阅读',
        description: '书下载完成后，没有网络也能继续翻页阅读。',
      },
    },
  },
  books: {
    title: '图书列表',
    count: '{n} 本',
    loadFailed: '加载图书列表失败。',
    duplicateId: '配置文件错误，存在id重复的图书。id={id}',
    empty: '暂无图书。',
    cached: '已缓存',
    notDownloaded: '未下载',
  },
  reader: {
    downloading: '正在下载图书…',
    downloadingPct: '正在下载图书… {pct}%',
    extracting: '正在解压 EPUB…',
    extractingProgress: '正在解压 EPUB… {loaded}/{total}',
    notFound: '未找到图书。',
    invalidPage: '页码无效。',
    pageLoadFailed: '无法加载该页内容。',
    loadFailed: '加载失败。',
    rendering: '正在绘制页面…',
    prevPage: '上一页',
    nextPage: '下一页',
    pageOf: '第 {page} / {total} 页',
  },
  settings: {
    title: '设置',
    configsUrlLabel: '图书配置文件地址',
    configsUrlHint:
      '留空使用默认 /configs.json；也可填写 https://…/configs.json',
    viewConfigGuide: '查看配置说明',
    save: '保存',
    restoreDefault: '恢复默认',
    saved: '已保存图书配置文件地址。',
    usingDefault: '已使用默认地址（{url}）。',
    restoredDefault: '已恢复默认地址（{url}）。',
    saveFailed: '保存失败。',
    restoreFailed: '恢复失败。',
    cacheTitle: '缓存',
    cacheDescription:
      '清除本机已下载的全部图书文件。下次打开任意图书时需重新下载。',
    clearCache: '清除全部缓存',
    clearCacheConfirmTitle: '清除全部缓存？',
    clearCacheConfirmBody:
      '将删除本机所有图书的本地缓存，下次打开需重新下载。',
    cancel: '取消',
    clear: '清除',
    cacheCleared: '已清除全部图书缓存。下次打开需重新下载。',
    clearCacheFailed: '清除缓存失败。',
  },
  about: {
    title: '关于',
    body: 'tdbook 是一个个人电子书浏览器：从配置文件读取书目，在浏览器中打开 EPUB / PDF，首次阅读时下载到本机，之后可离线阅读。纯静态部署，无需后端。',
    projectUrl: '项目地址',
  },
  configGuide: {
    title: '配置说明',
    introBefore:
      'tdbook 的书目来自一份 JSON 配置文件（默认',
    introAfter:
      '）。把文件放到可访问的地址后，在「设置」里填写该地址即可使用自己的书单。',
    stepsTitle: '使用步骤',
    step1Before: '按下方格式编写',
    step1After:
      '，把 EPUB / PDF 放到静态站点、对象存储或任意可公开访问的 URL。',
    step2Before: '打开',
    step2Middle: '，将「图书配置文件地址」改为你的',
    step2After: ' 地址（例如',
    step2End: '），然后保存。',
    step3Before: '回到',
    step3After:
      ' 刷新查看。首次打开某本书时会下载到本机 IndexedDB，之后可离线阅读。',
    settingsLink: '设置',
    booksLink: '图书列表',
    structureTitle: '文件结构',
    structureIntroBefore: '根对象包含',
    structureIntroAfter: ' 数组，每一项描述一本书：',
    colField: '字段',
    colRequired: '必填',
    colDescription: '说明',
    yes: '是',
    no: '否',
    exampleTitle: '示例',
    notesTitle: '注意事项',
    noteInvalid:
      '无效条目（缺 id、非法 path、未知 type 等）会被静默忽略，不会出现在列表中。',
    noteDuplicateBefore: '若存在重复',
    noteDuplicateAfter:
      '，列表页会提示，且只保留第一次出现的书。',
    noteCors:
      '跨域托管配置或图书文件时，服务器需允许浏览器跨域读取（CORS）。',
    noteCacheBefore:
      '更换配置地址或书目后，已缓存的旧书不会自动删除；可在设置中',
    noteCacheAfter: '。',
    clearCacheQuoted: '「清除全部缓存」',
    fields: {
      id: '图书唯一标识，也是阅读页路由 /book/:id 的参数。须为非空字符串，不能包含 /、\\ 或 ..。推荐用小写字母与中横线拼接（如 my-book-title）。重复的 id 只保留第一次出现的条目。',
      title: '显示标题，可与其他书重复。',
      author: '作者。可省略或填空字符串。',
      type: '格式：epub 或 pdf。省略时按 epub 处理。',
      path: '图书文件地址。须为 http(s)://… 远程链接，或站点绝对路径 /…（例如放在 public/ 下）。不支持相对路径、//… 或本地文件系统路径。',
      hover:
        '封面图地址，规则与 path 相同。设置后会覆盖从 EPUB/PDF 内提取的封面，用于图书列表展示。',
    },
  },
  errors: {
    invalidConfigsUrl: '无效的配置文件地址',
    localStorageWrite: '无法写入本地存储',
    downloadFailed: '下载失败（HTTP {status}）。',
    epubExtractFailed:
      '无法解压 EPUB（文件可能已损坏或不是有效的 zip）。',
    cacheBookFailed: '下载或缓存图书失败。',
    canvasCreateFailed: '无法创建画布。',
  },
}
