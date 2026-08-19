/* ========================================
   MiniMD — 存储层
   localStorage + IndexedDB 自动切换
   ======================================== */

const STORAGE_PREFIX = 'minimd_';
const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;
const DOCUMENTS_KEY = `${STORAGE_PREFIX}documents`;
const RECENT_KEY = `${STORAGE_PREFIX}recent`;
const ACTIVE_DOC_KEY = `${STORAGE_PREFIX}active`;
const DOCUMENTS_LIMIT = 50; // 超过此数量切换到 IndexedDB

// IndexedDB 配置
const DB_NAME = 'MiniMD';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
let idbDatabase = null;

/**
 * 检测是否应该使用 IndexedDB
 */
function shouldUseIndexedDB() {
  try {
    const docs = getDocumentsFromLS();
    return Object.keys(docs).length >= DOCUMENTS_LIMIT;
  } catch {
    return false;
  }
}

// ========================================
// localStorage API
// ========================================

export function getItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage read failed:', e);
    return null;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn('localStorage write failed:', e);
    return false;
  }
}

function getDocumentsFromLS() {
  const raw = getItem(DOCUMENTS_KEY);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDocumentsToLS(docs) {
  setItem(DOCUMENTS_KEY, JSON.stringify(docs));
}

function getRecentFromLS() {
  const raw = getItem(RECENT_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentToLS(recent) {
  setItem(RECENT_KEY, JSON.stringify(recent));
}

function getActiveDocIdFromLS() {
  return getItem(ACTIVE_DOC_KEY);
}

function saveActiveDocIdToLS(id) {
  setItem(ACTIVE_DOC_KEY, id);
}

// ========================================
// IndexedDB API
// ========================================

function openDB() {
  return new Promise((resolve, reject) => {
    if (idbDatabase) {
      resolve(idbDatabase);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updated', 'updated', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      idbDatabase = event.target.result;
      resolve(idbDatabase);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function getDocumentsFromIDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const docs = {};
      request.result.forEach(doc => {
        docs[doc.id] = doc;
      });
      resolve(docs);
    };
    request.onerror = () => reject(request.error);
  });
}

async function saveDocumentToIDB(doc) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(doc);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteDocumentFromIDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getRecentFromIDB() {
  const docs = await getDocumentsFromIDB();
  return Object.values(docs)
    .sort((a, b) => b.updated - a.updated)
    .slice(0, 20)
    .map(d => d.id);
}

async function getActiveDocIdFromIDB() {
  // 从 IndexedDB 获取最近打开的文档 ID
  // IndexedDB 不保存这个信息，我们依赖 localStorage
  return getActiveDocIdFromLS();
}

// ========================================
// Unified Storage API
// ========================================

let storageMode = 'localStorage';

export function getStorageMode() {
  return storageMode;
}

function detectMode() {
  storageMode = shouldUseIndexedDB() ? 'indexedDB' : 'localStorage';
  return storageMode;
}

// --- Document CRUD ---

export async function getDocuments() {
  detectMode();
  if (storageMode === 'localStorage') {
    return getDocumentsFromLS();
  }
  try {
    return await getDocumentsFromIDB();
  } catch (e) {
    console.error('IndexedDB get failed, falling back to localStorage:', e);
    storageMode = 'localStorage';
    return getDocumentsFromLS();
  }
}

export async function getDocument(id) {
  detectMode();
  if (storageMode === 'localStorage') {
    const docs = getDocumentsFromLS();
    return docs[id] || null;
  }
  try {
    const docs = await getDocumentsFromIDB();
    return docs[id] || null;
  } catch (e) {
    storageMode = 'localStorage';
    const docs = getDocumentsFromLS();
    return docs[id] || null;
  }
}

export async function saveDocument(doc) {
  detectMode();
  if (storageMode === 'localStorage') {
    const docs = getDocumentsFromLS();
    docs[doc.id] = {
      ...doc,
      updated: Date.now(),
    };
    saveDocumentsToLS(docs);
    // 更新最近列表
    const recent = getRecentFromLS();
    const idx = recent.indexOf(doc.id);
    if (idx > -1) recent.splice(idx, 1);
    recent.unshift(doc.id);
    saveRecentToLS(recent.slice(0, 50));
  } else {
    try {
      const docToSave = { ...doc, updated: Date.now() };
      await saveDocumentToIDB(docToSave);
    } catch (e) {
      console.error('IndexedDB save failed, falling back:', e);
      storageMode = 'localStorage';
      const docs = getDocumentsFromLS();
      docs[doc.id] = { ...doc, updated: Date.now() };
      saveDocumentsToLS(docs);
    }
  }
}

export async function deleteDocument(id) {
  detectMode();
  if (storageMode === 'localStorage') {
    const docs = getDocumentsFromLS();
    delete docs[id];
    saveDocumentsToLS(docs);
    const recent = getRecentFromLS();
    const idx = recent.indexOf(id);
    if (idx > -1) recent.splice(idx, 1);
    saveRecentToLS(recent);
  } else {
    try {
      await deleteDocumentFromIDB(id);
    } catch (e) {
      console.error('IndexedDB delete failed:', e);
    }
  }
}

// --- Recent documents ---

export async function getRecentDocuments() {
  detectMode();
  if (storageMode === 'localStorage') {
    const recent = getRecentFromLS();
    const docs = getDocumentsFromLS();
    return recent.map(id => docs[id]).filter(Boolean);
  }
  try {
    const recent = await getRecentFromIDB();
    const docs = await getDocumentsFromIDB();
    return recent.map(id => docs[id]).filter(Boolean);
  } catch {
    storageMode = 'localStorage';
    const recent = getRecentFromLS();
    const docs = getDocumentsFromLS();
    return recent.map(id => docs[id]).filter(Boolean);
  }
}

// --- Active document ---

export function getActiveDocumentId() {
  detectMode();
  return getActiveDocIdFromLS();
}

export function setActiveDocumentId(id) {
  saveActiveDocIdToLS(id);
}

// --- Settings ---

export function getSettings() {
  const raw = getItem(SETTINGS_KEY);
  try {
    return raw ? JSON.parse(raw) : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings) {
  setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Storage info ---

export function getStorageInfo() {
  detectMode();
  const info = {
    mode: storageMode,
    docCount: 0,
    usedBytes: 0,
  };

  if (storageMode === 'localStorage') {
    try {
      const docs = getDocumentsFromLS();
      info.docCount = Object.keys(docs).length;
      info.usedBytes = new Blob([JSON.stringify(docs)]).size;
    } catch {}
  } else {
    getDocuments().then(docs => {
      info.docCount = Object.keys(docs).length;
    }).catch(() => {});
  }

  return info;
}

// --- Default settings ---

export function getDefaultSettings() {
  return {
    fontFamily: '-apple-system, "PingFang SC", "Noto Sans SC", "Segoe UI", system-ui, sans-serif',
    fontMono: '"SF Mono", "Fira Code", "JetBrains Mono", "Consolas", monospace',
    fontSize: 16,
    h1Size: 28,
    h2Size: 22,
    h3Size: 18,
    lineHeight: 1.6,
    paragraphSpacing: 16,
    textColor: '#111111',
    linkColor: '#555555',
    quoteColor: '#333333',
    codeBg: '#f5f5f5',
    editorBg: '#ffffff',
    maxWidth: 720,
    padding: 32,
  };
}

// --- Presets ---

export const PRESETS = {
  default: {
    fontFamily: '-apple-system, "PingFang SC", "Noto Sans SC", "Segoe UI", system-ui, sans-serif',
    fontMono: '"SF Mono", "Fira Code", "JetBrains Mono", "Consolas", monospace',
    fontSize: 16,
    h1Size: 28,
    h2Size: 22,
    h3Size: 18,
    lineHeight: 1.6,
    paragraphSpacing: 16,
    textColor: '#111111',
    linkColor: '#555555',
    quoteColor: '#333333',
    codeBg: '#f5f5f5',
    editorBg: '#ffffff',
    maxWidth: 720,
    padding: 32,
  },
  compact: {
    fontSize: 14,
    h1Size: 24,
    h2Size: 20,
    h3Size: 16,
    lineHeight: 1.4,
    paragraphSpacing: 8,
    maxWidth: 680,
    padding: 24,
  },
  comfortable: {
    fontSize: 17,
    h1Size: 30,
    h2Size: 24,
    h3Size: 20,
    lineHeight: 1.7,
    paragraphSpacing: 20,
    maxWidth: 760,
    padding: 40,
  },
  large: {
    fontSize: 20,
    h1Size: 36,
    h2Size: 28,
    h3Size: 22,
    lineHeight: 1.8,
    paragraphSpacing: 24,
    maxWidth: 800,
    padding: 48,
  },
  minimal: {
    fontSize: 15,
    h1Size: 24,
    h2Size: 20,
    h3Size: 17,
    lineHeight: 1.8,
    paragraphSpacing: 12,
    textColor: '#333333',
    maxWidth: 640,
    padding: 40,
    linkColor: '#333333',
    quoteColor: '#999999',
    codeBg: '#fafafa',
  },
  serif: {
    fontFamily: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", Georgia, "Times New Roman", serif',
    fontMono: '"Noto Serif SC", "Source Han Serif SC", Georgia, "Times New Roman", serif',
    fontSize: 16,
    h1Size: 26,
    h2Size: 22,
    h3Size: 18,
    lineHeight: 1.8,
    paragraphSpacing: 16,
    textColor: '#222222',
    linkColor: '#333333',
    quoteColor: '#666666',
    maxWidth: 660,
    padding: 36,
  },
};

export function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return getDefaultSettings();
  const settings = getDefaultSettings();
  return { ...settings, ...preset };
}
