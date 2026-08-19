/* ========================================
   MiniMD — Markdown 解析 & 渲染管线
   ======================================== */

import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import TurndownService from 'turndown';

/**
 * 创建 markdown-it 实例
 * 配置插件：任务列表、脚注等
 * @returns {MarkdownIt}
 */
export function createMarkdownParser() {
  const md = new MarkdownIt({
    html: false,
    xhtmlOut: false,
    breaks: false,
    linkify: true,
    typographer: true,
    quotes: '""\'\'',
    highlight: null,
  });

  // 任务列表插件
  md.use(taskLists, {
    label: true,
    labelAfter: true,
  });

  return md;
}

/**
 * 创建 turndown 实例（HTML → Markdown）
 * 用于粘贴富文本时转换
 * @returns {TurndownService}
 */
export function createTurndownConverter() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
    preformattedCode: true,
  });

  // 保留代码块的语言标记
  td.addRule('fencedCodeBlock', {
    filter: (node) => {
      return node.nodeName === 'PRE' && node.querySelector('code');
    },
    replacement: (content, node) => {
      const pre = node.querySelector('pre');
      const code = node.querySelector('code');
      const langClass = code?.className?.match(/language-(\w+)/);
      const lang = langClass ? langClass[1] : '';
      return `\n\`\`\`${lang}\n${content.trim()}\n\`\`\`\n`;
    },
  });

  // 处理图片
  td.addRule('image', {
    filter: (node) => node.nodeName === 'IMG',
    replacement: (content, node) => {
      const src = node.getAttribute('src');
      const alt = node.getAttribute('alt') || '';
      return `![${alt}](${src})`;
    },
  });

  // 处理链接
  td.addRule('link', {
    filter: (node) => node.nodeName === 'A',
    replacement: (content, node) => {
      const href = node.getAttribute('href');
      return href ? `[${content}](${href})` : content;
    },
  });

  return td;
}

/**
 * 将 Markdown 文本渲染为 HTML
 * @param {MarkdownIt} md
 * @param {string} markdown
 * @returns {string}
 */
export function renderMarkdown(md, markdown) {
  if (!markdown || markdown.trim() === '') {
    return '';
  }
  return md.render(markdown);
}

/**
 * 从富文本 HTML 转换为 Markdown
 * @param {TurndownService} turndown
 * @param {string} html
 * @returns {string}
 */
export function htmlToMarkdown(turndown, html) {
  return turndown.turndown(html).trim();
}

/**
 * 从 contenteditable 元素中提取纯文本（保留换行）
 * 用于实时渲染
 * @param {HTMLElement} editor
 * @returns {string}
 */
export function extractTextFromEditor(editor) {
  // 使用 outerHTML 然后 strip HTML tags
  const html = editor.innerHTML;
  // 创建临时 div 提取纯文本
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * 获取 contenteditable 中的光标位置（文本偏移量）
 * @param {HTMLElement} editor
 * @returns {number}
 */
export function getCaretOffset(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return 0;

  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(editor);
  preRange.setEnd(range.endContainer, range.endOffset);

  // 计算所有文本节点的 offset
  let offset = 0;
  const textNodes = preRange.extractContents();
  const temp = document.createElement('div');
  temp.appendChild(textNodes);
  offset = temp.textContent.length;

  return offset;
}

/**
 * 在 contenteditable 中设置光标位置
 * @param {HTMLElement} editor
 * @param {number} offset
 */
export function setCaretOffset(editor, offset) {
  const selection = window.getSelection();
  const range = document.createRange();
  let currentOffset = 0;

  // 遍历文本节点找到目标位置
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
  let node;

  while ((node = walker.nextNode())) {
    const nodeLength = node.textContent.length;
    if (currentOffset + nodeLength >= offset) {
      range.setStart(node, offset - currentOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentOffset += nodeLength;
  }

  // 如果 offset 超出范围，设置到末尾
  range.selectNodeContents(editor);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 从 contenteditable 中提取 Markdown 源码
 * 思路：获取 innerText，然后重新渲染对比
 * 对于 WYSIWYG 模式，我们维护一个 hidden 的 markdown textarea
 * @param {HTMLElement} editor
 * @returns {string}
 */
export function extractMarkdownFromEditor(editor) {
  // 在 WYSIWYG 模式下，我们通过 innerText 获取纯文本内容
  // 注意：这会丢失格式信息，所以最佳方案是维护一个隐藏的 textarea
  return editor.innerText || '';
}
