/* ========================================
   MiniMD — 入口文件
   ======================================== */

import {
  initMarkdown,
  initEditorLayout,
  setEditorContent,
  getEditorText,
  updateEditorDisplay,
  getExportHTML,
  bindAutoSave,
  bindManualSave,
  syncEditorStyles,
} from './editor.js';

import {
  getDocuments,
  saveDocument,
  deleteDocument,
  getRecentDocuments,
  getActiveDocumentId,
  setActiveDocumentId,
  getSettings,
  saveSettings,
  getDefaultSettings,
  applyPreset,
  getStorageMode,
} from './storage.js';

import {
  initFontSelectors,
  loadSettingsToUI,
  readSettingsFromUI,
  applySettingsToEditor,
  bindSettingsEvents,
  initPresetButtons,
} from './settings.js';

import {
  bindToolbarEvents,
  setupAutoSave,
  manualSave,
  toggleSidebar,
} from './toolbar.js';

import { exportHTML, exportPDF } from './export.js';

// --- 状态 ---
let currentDocId = null;
let currentDocTitle = '';
let currentDocContent = '';

// --- DOM 引用 ---
const editor = document.getElementById('editor');
const docList = document.getElementById('doc-list');
const docTitleEl = document.getElementById('doc-title');
const saveStatusEl = document.getElementById('save-status');
const storageInfoEl = document.getElementById('storage-info');

// ========================================
// 初始化
// ========================================

async function init() {
  // 1. 初始化 Markdown 解析器
  initMarkdown();

  // 2. 加载设置
  const settings = getSettings();
  applySettingsToEditor(settings);

  // 3. 初始化编辑器布局（单栏：透明 textarea + 渲染预览）
  initEditorLayout();

  // 4. 初始化设置面板
  initFontSelectors();
  loadSettingsToUI(settings);
  setupSettingsPanel(settings);

  // 5. 绑定工具栏事件
  bindToolbarEvents(
    handleNewDocument,
    handleOpenDocument,
    handleSave,
    handleToggleSidebar,
    handleExportAction,
    handleOpenSettings
  );

  // 6. 设置自动保存
  const autoSave = setupAutoSave(handleSave, saveStatusEl);

  // 7. 绑定编辑器事件
  bindAutoSave(autoSave);
  bindManualSave(() => manualSave(handleSave, saveStatusEl));

  // 8. 加载文档
  await loadActiveDocument();

  // 9. 加载文档列表
  await renderDocList();

  // 10. 更新存储信息
  updateStorageInfo();

  // 11. 聚焦编辑器
  setTimeout(() => {
    const source = document.getElementById('md-source');
    if (source) source.focus();
  }, 100);
}

// ========================================
// 文档管理
// ========================================

function generateId() {
  return 'doc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

async function handleNewDocument() {
  const newId = generateId();
  const newDoc = {
    id: newId,
    title: '无标题文档',
    content: '# 新建文档\n\n开始输入 Markdown...',
    updated: Date.now(),
  };

  await saveDocument(newDoc);
  setActiveDocumentId(newId);
  loadDocument(newDoc);
  renderDocList();
  updateStorageInfo();

  setTimeout(() => {
    const source = document.getElementById('md-source');
    if (source) source.focus();
  }, 50);
}

async function handleSave() {
  if (!currentDocId) return;

  const content = getEditorText();
  currentDocContent = content;

  const doc = {
    id: currentDocId,
    title: currentDocTitle,
    content: content,
    updated: Date.now(),
  };

  await saveDocument(doc);
}

async function handleDeleteDocument(docId, event) {
  event?.stopPropagation();

  if (!confirm('确定要删除这个文档吗？')) return;

  await deleteDocument(docId);

  if (currentDocId === docId) {
    const docs = await getRecentDocuments();
    if (docs.length > 0) {
      setActiveDocumentId(docs[0].id);
      loadDocument(docs[0]);
    } else {
      await handleNewDocument();
    }
  }

  renderDocList();
  updateStorageInfo();
}

async function handleOpenDocument(docId, event) {
  if (event) event.stopPropagation();

  const doc = await getDocument(docId);
  if (doc) {
    setActiveDocumentId(docId);
    loadDocument(doc);
    renderDocList();
  }
}

function loadDocument(doc) {
  currentDocId = doc.id;
  currentDocTitle = doc.title || '无标题文档';
  currentDocContent = doc.content || '';

  docTitleEl.textContent = currentDocTitle;
  setEditorContent(currentDocContent);

  setTimeout(() => {
    const source = document.getElementById('md-source');
    if (source) source.focus();
  }, 50);
}

async function loadActiveDocument() {
  const activeId = getActiveDocumentId();
  if (activeId) {
    const doc = await getDocument(activeId);
    if (doc) {
      loadDocument(doc);
      return;
    }
  }

  await handleNewDocument();
}

async function renderDocList() {
  if (!docList) return;

  const recentDocs = await getRecentDocuments();

  if (recentDocs.length === 0) {
    docList.innerHTML = `
      <div class="empty-state" style="padding: 20px; text-align: center; color: var(--text-tertiary); font-size: 12px;">
        暂无文档
      </div>`;
    return;
  }

  docList.innerHTML = recentDocs.map(doc => {
    const isActive = doc.id === currentDocId;
    const dateStr = formatDate(doc.updated);
    const title = doc.title || '无标题文档';

    return `
      <div class="doc-list-item ${isActive ? 'active' : ''}" data-id="${doc.id}">
        <span class="doc-list-item-title">${escapeHTML(title)}</span>
        <span class="doc-list-item-date">${dateStr}</span>
        <button class="doc-list-item-delete" data-delete-id="${doc.id}" title="删除">×</button>
      </div>`;
  }).join('');

  docList.querySelectorAll('.doc-list-item').forEach(item => {
    item.addEventListener('click', () => {
      handleOpenDocument(item.dataset.id);
    });
  });

  docList.querySelectorAll('.doc-list-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      handleDeleteDocument(btn.dataset.deleteId, e);
    });
  });

  docList.querySelectorAll('.doc-list-item-title').forEach(span => {
    span.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const item = span.closest('.doc-list-item');
      const docId = item.dataset.id;
      const currentTitle = span.textContent;

      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentTitle;
      input.className = 'doc-list-item-title';
      input.style.cssText = 'flex:1;width:100%;padding:2px 4px;border:1px solid var(--border);border-radius:2px;font-size:13px;font-family:var(--font-ui);outline:none;';

      span.replaceWith(input);
      input.focus();
      input.select();

      const finishRename = async () => {
        const newTitle = input.value.trim() || '无标题文档';
        const doc = await getDocument(docId);
        if (doc) {
          doc.title = newTitle;
          await saveDocument(doc);
          if (doc.id === currentDocId) {
            currentDocTitle = newTitle;
            docTitleEl.textContent = newTitle;
          }
          renderDocList();
        }
      };

      input.addEventListener('blur', finishRename);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        else if (e.key === 'Escape') { input.value = currentTitle; input.blur(); }
      });
    });
  });
}

// ========================================
// 侧边栏
// ========================================

function handleToggleSidebar() {
  toggleSidebar();
}

// ========================================
// 设置面板
// ========================================

function handleOpenSettings() {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.classList.toggle('hidden');
}

function setupSettingsPanel(currentSettings) {
  bindSettingsEvents();

  // 应用设置
  const btnApply = document.getElementById('btn-apply-settings');
  if (btnApply) {
    btnApply.addEventListener('click', async () => {
      const settings = readSettingsFromUI();
      saveSettings(settings);
      applySettingsToEditor(settings);

      // 同步编辑器排版样式，确保 textarea 和预览区完全一致
      syncEditorStyles(settings);

      document.getElementById('settings-modal')?.classList.add('hidden');
    });
  }

  // 重置设置
  const btnReset = document.getElementById('btn-reset-settings');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      const defaultSettings = getDefaultSettings();
      saveSettings(defaultSettings);
      applySettingsToEditor(defaultSettings);
      loadSettingsToUI(defaultSettings);
      syncEditorStyles(defaultSettings);
    });
  }

  // 预设按钮
  initPresetButtons(async (presetName) => {
    const preset = applyPreset(presetName);
    saveSettings(preset);
    applySettingsToEditor(preset);
    loadSettingsToUI(preset);
    syncEditorStyles(preset);
  });
}

// ========================================
// 导出
// ========================================

function handleExportAction(event) {
  const btn = event?.target;
  if (!btn) return;

  if (btn.id === 'btn-export-html') {
    const htmlContent = getExportHTML();
    const settings = getSettings();
    exportHTML(currentDocTitle, htmlContent, settings);
  } else if (btn.id === 'btn-export-pdf') {
    exportPDF();
  }

  document.getElementById('export-menu')?.classList.add('hidden');
}

// ========================================
// 辅助函数
// ========================================

function updateStorageInfo() {
  const mode = getStorageMode();
  if (storageInfoEl) {
    storageInfoEl.textContent = mode === 'indexedDB' ? 'IndexedDB' : 'localStorage';
  }
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (diff < 2 * 24 * 60 * 60 * 1000 && date.getDate() === yesterday.getDate()) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `昨天 ${h}:${m}`;
  }

  const y = date.getFullYear().toString();
  const mStr = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');

  if (y === now.getFullYear().toString()) {
    return `${mStr}-${d}`;
  }
  return `${y}-${mStr}-${d}`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========================================
// 启动
// ========================================

init().catch(err => {
  console.error('MiniMD 初始化失败:', err);
});
