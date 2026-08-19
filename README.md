# MiniMD

一个纯静态、零后端的 Markdown 实时渲染编辑器。

## 特性

- **所见即所得** — 透明输入层 + 实时渲染预览，输入即显示效果
- **纯前端** — 无后端，数据存储在浏览器 localStorage / IndexedDB
- **极简设计** — 黑白灰配色，无多余装饰
- **实时渲染** — 输入过程中即时渲染 Markdown 为 HTML
- **粘贴转换** — 支持从 Word/网页粘贴富文本，自动转换为 Markdown
- **排版配置** — 自定义字体、字号、颜色、行距、段距等
- **预设方案** — 6 种预设排版风格一键切换
- **多文档管理** — 新建、打开、保存、删除、重命名
- **自动保存** — 编辑后 1.5 秒无操作自动保存
- **导出 HTML** — 导出自包含的 HTML 文件
- **导出 PDF** — 调用浏览器打印功能，生成矢量 PDF
- **响应式布局** — 适配 PC、平板、手机

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 技术栈

| 层次 | 技术 |
|------|------|
| 构建 | Vite 5 |
| 语言 | Vanilla JS (ES Module) |
| Markdown 解析 | markdown-it + markdown-it-task-lists |
| 富文本转换 | turndown |
| 存储 | localStorage + IndexedDB |

## 文件结构

```
minimd/
├── index.html                    # 入口
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                   # 入口模块
│   ├── editor.js                 # 编辑器核心（透明 textarea + 渲染预览）
│   ├── markdown.js               # Markdown 解析与渲染
│   ├── storage.js                # 存储层（localStorage + IndexedDB）
│   ├── settings.js               # 排版设置管理
│   ├── export.js                 # HTML / PDF 导出
│   ├── toolbar.js                # 工具栏 UI
│   └── styles/
│       ├── main.css              # 全局样式 & 响应式
│       ├── editor.css            # 编辑器样式
│       └── print.css             # 打印样式
└── public/
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` / `Cmd+S` | 保存文档 |
| `Ctrl+N` / `Cmd+N` | 新建文档 |
| `Ctrl+,` / `Cmd+,` | 打开设置面板 |
| `Escape` | 关闭弹窗 |

## 预设方案

- **默认** — 平衡的排版风格
- **紧凑** — 节省空间，适合长文
- **舒适** — 更大的字号和行距
- **大号字** — 适合演示和展示
- **极简** — 最少的排版装饰
- **衬线体** — 使用衬线字体，适合正式文档

## 存储

- 文档数据存储在浏览器的 localStorage（< 50 个文档）或 IndexedDB（≥ 50 个文档）
- 设置数据存储在 localStorage
- 数据不会自动同步到云端

## 构建产物

生产构建输出在 `dist/` 目录，可直接部署到任何静态文件服务器（Nginx、GitHub Pages、Vercel 等）。
