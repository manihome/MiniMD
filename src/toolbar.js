/* ========================================
   MiniMD — 工具栏 UI 与事件绑定
   ======================================== */

let sidebarVisible = true;
let exportMenuOpen = false;
let autoSaveTimer = null;
let saveStatusTimer = null;

/**
 * 绑定工具栏按钮事件
 */
export function bindToolbarEvents(onNew, onOpen, onSave, onToggleSidebar, onExportMenu, onSettings) {
  // 新建文档
  const btnNew = document.getElementById('btn-new');
  if (btnNew) {
    btnNew.addEventListener('click', onNew);
  }

  // 文档列表
  const btnDocs = document.getElementById('btn-docs');
  if (btnDocs) {
    btnDocs.addEventListener('click', onToggleSidebar);
  }

  // 保存
  const btnSave = document.getElementById('btn-save');
  if (btnSave) {
    btnSave.addEventListener('click', onSave);
  }

  // 导出
  const btnExport = document.getElementById('btn-export');
  const exportMenu = document.getElementById('export-menu');
  if (btnExport && exportMenu) {
    btnExport.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenuOpen = !exportMenuOpen;
      exportMenu.classList.toggle('hidden', !exportMenuOpen);
    });
  }

  // 设置
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', onSettings);
  }

  // 关闭设置
  const btnCloseSettings = document.getElementById('btn-close-settings');
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      document.getElementById('settings-modal')?.classList.add('hidden');
    });
  }

  // 收起侧边栏
  const btnCollapseSidebar = document.getElementById('btn-collapse-sidebar');
  if (btnCollapseSidebar) {
    btnCollapseSidebar.addEventListener('click', onToggleSidebar);
  }

  // 点击其他地方关闭导出菜单
  document.addEventListener('click', (e) => {
    if (exportMenuOpen && !exportMenu.contains(e.target) && !btnExport.contains(e.target)) {
      exportMenuOpen = false;
      exportMenu.classList.add('hidden');
    }
  });

  // ESC 关闭设置
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const settingsModal = document.getElementById('settings-modal');
      if (settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
      }
      if (exportMenuOpen) {
        exportMenuOpen = false;
        exportMenu.classList.add('hidden');
      }
    }
  });

  // Ctrl+, 打开设置
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      onSettings();
    }
    // Ctrl+N 新建文档
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      onNew();
    }
  });

  // 导出菜单项
  const btnExportHTML = document.getElementById('btn-export-html');
  const btnExportPDF = document.getElementById('btn-export-pdf');
  if (btnExportHTML) btnExportHTML.addEventListener('click', onExportMenu);
  if (btnExportPDF) btnExportPDF.addEventListener('click', onExportMenu);
}

/**
 * 设置自动保存
 * @param {Function} saveFn - 保存函数
 */
export function setupAutoSave(saveFn, statusElement) {
  autoSaveTimer = null;

  return function triggerAutoSave() {
    // 清除之前的定时器
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // 显示"保存中"
    if (statusElement) {
      statusElement.textContent = '保存中...';
      statusElement.className = 'save-status saving';
    }

    // 1.5s 无操作后触发保存
    autoSaveTimer = setTimeout(() => {
      saveFn().then(() => {
        // 显示"已保存"
        if (statusElement) {
          statusElement.textContent = '已保存';
          statusElement.className = 'save-status saved';
        }

        // 3s 后隐藏状态
        if (saveStatusTimer) {
          clearTimeout(saveStatusTimer);
        }
        saveStatusTimer = setTimeout(() => {
          if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = 'save-status';
          }
        }, 3000);
      }).catch(() => {
        if (statusElement) {
          statusElement.textContent = '保存失败';
          statusElement.className = 'save-status';
        }
      });
    }, 1500);
  };
}

/**
 * 手动保存
 */
export function manualSave(saveFn, statusElement) {
  if (statusElement) {
    statusElement.textContent = '保存中...';
    statusElement.className = 'save-status saving';
  }

  saveFn().then(() => {
    if (statusElement) {
      statusElement.textContent = '已保存';
      statusElement.className = 'save-status saved';
    }

    if (saveStatusTimer) clearTimeout(saveStatusTimer);
    saveStatusTimer = setTimeout(() => {
      if (statusElement) {
        statusElement.textContent = '';
        statusElement.className = 'save-status';
      }
    }, 3000);
  }).catch(() => {
    if (statusElement) {
      statusElement.textContent = '保存失败';
      statusElement.className = 'save-status';
    }
  });
}

/**
 * 切换侧边栏显示
 */
export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const editorArea = document.getElementById('editor-area');

  sidebarVisible = !sidebarVisible;

  if (sidebarVisible) {
    sidebar?.classList.remove('collapsed');
    editorArea?.classList.remove('sidebar-collapsed');
  } else {
    sidebar?.classList.add('collapsed');
    editorArea?.classList.add('sidebar-collapsed');
  }
}
