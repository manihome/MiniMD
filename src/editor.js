/* ========================================
   MiniMD — 编辑器核心（单栏：透明 textarea + 渲染预览）
   textarea 作为输入层，渲染预览作为显示层
   两者通过完全一致的 CSS 变量确保光标位置对应
   ======================================== */

import { createMarkdownParser, renderMarkdown } from './markdown.js';
import { htmlToMarkdown, createTurndownConverter } from './markdown.js';

let md = null;
let turndown = null;
let debounceTimer = null;
let autoSaveTimer = null;

/**
 * 初始化 markdown 解析器
 */
export function initMarkdown() {
  md = createMarkdownParser();
  turndown = createTurndownConverter();
}

/**
 * 获取或创建 textarea 和预览元素
 */
function ensureElements() {
  const wrapper = document.getElementById('editor-wrapper');
  const preview = document.getElementById('editor');
  let source = document.getElementById('md-source');

  if (!wrapper || !preview) {
    console.error('Editor wrapper or preview element not found');
    return null;
  }

  if (!source) {
    source = document.createElement('textarea');
    source.id = 'md-source';
  }

  return { wrapper, preview, source };
}

/**
 * 初始化编辑器布局
 * 将 textarea 和预览叠放在同一个容器，确保布局完全一致
 */
export function initEditorLayout() {
  const { wrapper, preview, source } = ensureElements();
  if (!wrapper || !preview || !source) return;

  // 如果已经初始化过，直接返回
  if (wrapper.querySelector('#editor-layer')) return;

  const layer = document.createElement('div');
  layer.id = 'editor-layer';
  layer.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  `;

  // 预览层（z-index: 0）
  preview.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    z-index: 0;
    pointer-events: none;
    margin: 0;
    padding: var(--setting-padding, 32px);
    font-family: var(--setting-font-family);
    font-size: var(--setting-font-size);
    line-height: var(--setting-line-height);
    color: var(--setting-text-color);
    background: var(--setting-editor-bg);
    max-width: var(--setting-max-width);
    box-sizing: border-box;
    letter-spacing: 0;
  `;

  // 输入层 textarea（z-index: 1）
  source.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    z-index: 1;
    margin: 0;
    padding: var(--setting-padding, 32px);
    font-family: var(--setting-font-family);
    font-size: var(--setting-font-size);
    line-height: var(--setting-line-height);
    color: transparent;
    caret-color: var(--text-primary);
    background: var(--setting-editor-bg);
    max-width: var(--setting-max-width);
    box-sizing: border-box;
    border: none;
    outline: none;
    resize: none;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    letter-spacing: 0;
    text-align: left;
  `;

  source.spellcheck = true;

  // 清空 wrapper，放入层叠容器
  wrapper.innerHTML = '';
  layer.appendChild(preview);
  layer.appendChild(source);
  wrapper.appendChild(layer);

  // 绑定事件
  bindEditorEvents(source, preview);
}

/**
 * 获取编辑器元素
 */
function getEditorSource() {
  return document.getElementById('md-source');
}

function getEditorPreview() {
  return document.getElementById('editor');
}

/**
 * 设置编辑器内容
 * @param {string} markdownText
 */
export function setEditorContent(markdownText) {
  const source = getEditorSource();
  const preview = getEditorPreview();
  if (!source || !preview || !md) return;

  source.value = markdownText || '';
  renderPreview(source, preview);
  updateWordCount(preview);
}

/**
 * 获取编辑器内容
 * @returns {string}
 */
export function getEditorText() {
  const source = getEditorSource();
  return source ? source.value : '';
}

/**
 * 渲染预览区
 */
function renderPreview(source, preview) {
  if (!md) return;

  const markdownText = source.value;

  if (markdownText.trim() === '') {
    preview.innerHTML = '<p style="color: var(--text-tertiary); font-style: italic; margin: 0;">开始输入 Markdown...</p>';
  } else {
    preview.innerHTML = renderMarkdown(md, markdownText);
  }
}

/**
 * 处理粘贴
 */
function handlePaste(source, event) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const html = clipboardData.getData('text/html');
  const plainText = clipboardData.getData('text/plain');

  if (html && html !== plainText) {
    event.preventDefault();
    if (turndown) {
      const mdText = htmlToMarkdown(turndown, html);
      insertAtCaret(source, mdText);
    } else {
      insertAtCaret(source, plainText);
    }
  }
}

/**
 * 在光标位置插入文本
 */
function insertAtCaret(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  textarea.value = value.substring(0, start) + text + value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * 同步滚动位置
 */
function syncScroll(target, source) {
  if (!target || !source) return;

  // 基于滚动比例的同步
  const ratio = source.scrollTop / Math.max(1, source.scrollHeight - source.clientHeight);
  target.scrollTop = ratio * Math.max(0, target.scrollHeight - target.clientHeight);

  const hRatio = source.scrollLeft / Math.max(1, source.scrollWidth - source.clientWidth);
  target.scrollLeft = hRatio * Math.max(0, target.scrollWidth - target.clientWidth);
}

/**
 * 更新字数统计
 */
function updateWordCount(preview) {
  const text = preview.innerText || preview.textContent || '';
  const charCount = text.length;
  const lineCount = text ? text.split('\n').length : 0;

  const wordCountEl = document.getElementById('word-count');
  const lineCountEl = document.getElementById('line-count');

  if (wordCountEl) wordCountEl.textContent = `${charCount} 字`;
  if (lineCountEl) lineCountEl.textContent = `${lineCount} 行`;
}

/**
 * 绑定编辑器事件
 */
function bindEditorEvents(source, preview) {
  if (!source) return;

  // 输入事件：实时渲染
  source.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    renderPreview(source, preview);
    updateWordCount(preview);

    // 自动保存
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('minimd-auto-save'));
    }, 1500);
  });

  // 滚动同步
  source.addEventListener('scroll', () => {
    syncScroll(preview, source);
  });

  preview.addEventListener('scroll', () => {
    syncScroll(source, preview);
  });

  // 粘贴处理
  source.addEventListener('paste', (e) => handlePaste(source, e));

  // 键盘快捷键
  source.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S: 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('minimd-save'));
    }
    // Tab: 插入空格
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCaret(source, '  ');
    }
  });
}

/**
 * 绑定自动保存回调
 */
export function bindAutoSave(onSave) {
  document.addEventListener('minimd-auto-save', () => {
    onSave();
  });
}

/**
 * 绑定手动保存回调
 */
export function bindManualSave(onSave) {
  document.addEventListener('minimd-save', () => {
    onSave();
  });
}

/**
 * 更新编辑器显示（设置更改后重新渲染）
 * 确保 textarea 和预览区样式完全一致
 */
export function updateEditorDisplay(markdownText) {
  const source = getEditorSource();
  const preview = getEditorPreview();
  if (!source || !preview) return;

  source.value = markdownText;
  renderPreview(source, preview);
  updateWordCount(preview);
}

/**
 * 获取导出 HTML
 */
export function getExportHTML() {
  const preview = getEditorPreview();
  return preview ? preview.innerHTML : '';
}

/**
 * 同步 textarea 和预览区的排版样式
 * 确保字体、字号、行高、内边距完全一致，解决光标偏移
 */
export function syncEditorStyles(settings) {
  const source = getEditorSource();
  const preview = getEditorPreview();
  if (!source || !preview) return;

  // 关键：确保 textarea 和预览区使用完全相同的排版属性
  const commonStyles = {
    fontFamily: settings.fontFamily,
    fontSize: `${settings.fontSize}px`,
    lineHeight: String(settings.lineHeight),
    letterSpacing: '0',
    padding: `${settings.padding}px`,
    maxWidth: `${settings.maxWidth}px`,
    background: settings.editorBg,
  };

  // 应用到 textarea
  source.style.fontFamily = commonStyles.fontFamily;
  source.style.fontSize = commonStyles.fontSize;
  source.style.lineHeight = commonStyles.lineHeight;
  source.style.letterSpacing = commonStyles.letterSpacing;
  source.style.padding = commonStyles.padding;
  source.style.maxWidth = commonStyles.maxWidth;
  source.style.background = commonStyles.background;

  // 应用到预览区
  preview.style.fontFamily = commonStyles.fontFamily;
  preview.style.fontSize = commonStyles.fontSize;
  preview.style.lineHeight = commonStyles.lineHeight;
  preview.style.letterSpacing = commonStyles.letterSpacing;
  preview.style.padding = commonStyles.padding;
  preview.style.maxWidth = commonStyles.maxWidth;
  preview.style.background = commonStyles.background;

  // 重新渲染
  const content = getEditorText();
  setEditorContent(content);
}
