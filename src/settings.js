/* ========================================
   MiniMD — 排版设置管理
   ======================================== */

import { getSettings, saveSettings, getDefaultSettings } from './storage.js';

const settingElements = {
  fontFamily: document.getElementById('setting-font-family'),
  fontMono: document.getElementById('setting-font-mono'),
  fontSize: document.getElementById('setting-font-size'),
  h1Size: document.getElementById('setting-h1-size'),
  h2Size: document.getElementById('setting-h2-size'),
  h3Size: document.getElementById('setting-h3-size'),
  lineHeight: document.getElementById('setting-line-height'),
  paragraphSpacing: document.getElementById('setting-paragraph-spacing'),
  textColor: document.getElementById('setting-text-color'),
  linkColor: document.getElementById('setting-link-color'),
  quoteColor: document.getElementById('setting-quote-color'),
  codeBg: document.getElementById('setting-code-bg'),
  editorBg: document.getElementById('setting-editor-bg'),
  maxWidth: document.getElementById('setting-max-width'),
  padding: document.getElementById('setting-padding'),
};

/**
 * 获取系统可用字体列表
 */
export function getAvailableFonts() {
  const baseFonts = [
    '-apple-system',
    '"PingFang SC"',
    '"Noto Sans SC"',
    '"Segoe UI"',
    'system-ui',
    'sans-serif',
  ];

  // 常用中文字体
  const zhFonts = [
    '"PingFang SC"',
    '"Noto Sans SC"',
    '"Microsoft YaHei"',
    '"WenQuanYi Micro Hei"',
    '"SimHei"',
    '"SimSun"',
    '"KaiTi"',
    '"FangSong"',
  ];

  // 常用英文字体
  const enFonts = [
    '"Helvetica Neue"',
    '"Arial"',
    '"Georgia"',
    '"Times New Roman"',
    '"Courier New"',
    '"Verdana"',
    '"Trebuchet MS"',
    '"Palatino"',
  ];

  // 等宽字体
  const monoFonts = [
    '"SF Mono"',
    '"Fira Code"',
    '"JetBrains Mono"',
    '"Cascadia Code"',
    '"Consolas"',
    '"Monaco"',
    '"Source Code Pro"',
    '"Courier New"',
  ];

  return {
    family: [...new Set([...baseFonts, ...zhFonts, ...enFonts])],
    mono: [...new Set([...monoFonts])],
  };
}

/**
 * 初始化字体下拉框
 */
export function initFontSelectors() {
  const fonts = getAvailableFonts();

  // 正文/标题字体
  const fontFamilySelect = settingElements.fontFamily;
  fonts.family.forEach(font => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font.replace(/"/g, '');
    fontFamilySelect.appendChild(option);
  });

  // 等宽字体
  const fontMonoSelect = settingElements.fontMono;
  fonts.mono.forEach(font => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font.replace(/"/g, '');
    fontMonoSelect.appendChild(option);
  });
}

/**
 * 加载设置到 UI 控件
 */
export function loadSettingsToUI(settings) {
  if (settingElements.fontFamily) {
    settingElements.fontFamily.value = settings.fontFamily;
  }
  if (settingElements.fontMono) {
    settingElements.fontMono.value = settings.fontMono;
  }
  if (settingElements.fontSize) {
    settingElements.fontSize.value = settings.fontSize;
    settingElements.fontSize.nextElementSibling.textContent = `${settings.fontSize}px`;
  }
  if (settingElements.h1Size) {
    settingElements.h1Size.value = settings.h1Size;
    settingElements.h1Size.nextElementSibling.textContent = `${settings.h1Size}px`;
  }
  if (settingElements.h2Size) {
    settingElements.h2Size.value = settings.h2Size;
    settingElements.h2Size.nextElementSibling.textContent = `${settings.h2Size}px`;
  }
  if (settingElements.h3Size) {
    settingElements.h3Size.value = settings.h3Size;
    settingElements.h3Size.nextElementSibling.textContent = `${settings.h3Size}px`;
  }
  if (settingElements.lineHeight) {
    settingElements.lineHeight.value = settings.lineHeight;
    settingElements.lineHeight.nextElementSibling.textContent = settings.lineHeight.toFixed(2);
  }
  if (settingElements.paragraphSpacing) {
    settingElements.paragraphSpacing.value = settings.paragraphSpacing;
    settingElements.paragraphSpacing.nextElementSibling.textContent = `${settings.paragraphSpacing}px`;
  }
  if (settingElements.textColor) {
    settingElements.textColor.value = settings.textColor;
  }
  if (settingElements.linkColor) {
    settingElements.linkColor.value = settings.linkColor;
  }
  if (settingElements.quoteColor) {
    settingElements.quoteColor.value = settings.quoteColor;
  }
  if (settingElements.codeBg) {
    settingElements.codeBg.value = settings.codeBg;
  }
  if (settingElements.editorBg) {
    settingElements.editorBg.value = settings.editorBg;
  }
  if (settingElements.maxWidth) {
    settingElements.maxWidth.value = settings.maxWidth;
    settingElements.maxWidth.nextElementSibling.textContent = `${settings.maxWidth}px`;
  }
  if (settingElements.padding) {
    settingElements.padding.value = settings.padding;
    settingElements.padding.nextElementSibling.textContent = `${settings.padding}px`;
  }
}

/**
 * 从 UI 控件读取设置
 */
export function readSettingsFromUI() {
  const settings = {
    fontFamily: settingElements.fontFamily?.value || '-apple-system, "PingFang SC", "Noto Sans SC", sans-serif',
    fontMono: settingElements.fontMono?.value || '"SF Mono", "Fira Code", "Consolas", monospace',
    fontSize: parseFloat(settingElements.fontSize?.value) || 16,
    h1Size: parseInt(settingElements.h1Size?.value) || 28,
    h2Size: parseInt(settingElements.h2Size?.value) || 22,
    h3Size: parseInt(settingElements.h3Size?.value) || 18,
    lineHeight: parseFloat(settingElements.lineHeight?.value) || 1.6,
    paragraphSpacing: parseInt(settingElements.paragraphSpacing?.value) || 16,
    textColor: settingElements.textColor?.value || '#111111',
    linkColor: settingElements.linkColor?.value || '#555555',
    quoteColor: settingElements.quoteColor?.value || '#333333',
    codeBg: settingElements.codeBg?.value || '#f5f5f5',
    editorBg: settingElements.editorBg?.value || '#ffffff',
    maxWidth: parseInt(settingElements.maxWidth?.value) || 720,
    padding: parseInt(settingElements.padding?.value) || 32,
  };
  return settings;
}

/**
 * 将设置应用到编辑器
 */
export function applySettingsToEditor(settings) {
  const root = document.documentElement;

  // CSS 变量设置
  root.style.setProperty('--setting-font-family', settings.fontFamily);
  root.style.setProperty('--setting-font-mono', settings.fontMono);
  root.style.setProperty('--setting-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--setting-h1-size', `${settings.h1Size}px`);
  root.style.setProperty('--setting-h2-size', `${settings.h2Size}px`);
  root.style.setProperty('--setting-h3-size', `${settings.h3Size}px`);
  root.style.setProperty('--setting-line-height', String(settings.lineHeight));
  root.style.setProperty('--setting-paragraph-spacing', `${settings.paragraphSpacing}px`);
  root.style.setProperty('--setting-text-color', settings.textColor);
  root.style.setProperty('--setting-link-color', settings.linkColor);
  root.style.setProperty('--setting-quote-color', settings.quoteColor);
  root.style.setProperty('--setting-code-bg', settings.codeBg);
  root.style.setProperty('--setting-editor-bg', settings.editorBg);
  root.style.setProperty('--setting-max-width', `${settings.maxWidth}px`);
  root.style.setProperty('--setting-padding', `${settings.padding}px`);
}

/**
 * 绑定设置面板的事件
 */
export function bindSettingsEvents(settingsPanel, onSave, onPreview) {
  // 滑块实时更新
  const sliderInputs = settingElements.fontSize;
  const sliderElements = [
    settingElements.fontSize,
    settingElements.h1Size,
    settingElements.h2Size,
    settingElements.h3Size,
    settingElements.lineHeight,
    settingElements.paragraphSpacing,
    settingElements.maxWidth,
    settingElements.padding,
  ];

  sliderElements.forEach(el => {
    if (!el) return;
    el.addEventListener('input', (e) => {
      const valueSpan = el.nextElementSibling;
      const unit = el.id.includes('Size') || el.id === 'padding' || el.id === 'maxWidth' || el.id === 'paragraphSpacing' ? 'px' : '';
      const displayValue = el.id === 'lineHeight' ? parseFloat(el.value).toFixed(2) : el.value;
      valueSpan.textContent = `${displayValue}${unit}`;
      // 实时预览
      const settings = readSettingsFromUI();
      applySettingsToEditor(settings);
    });
  });

  // 颜色选择器
  const colorInputs = [
    settingElements.textColor,
    settingElements.linkColor,
    settingElements.quoteColor,
    settingElements.codeBg,
    settingElements.editorBg,
  ];

  colorInputs.forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => {
      const settings = readSettingsFromUI();
      applySettingsToEditor(settings);
    });
  });

  // 字体选择器
  if (settingElements.fontFamily) {
    settingElements.fontFamily.addEventListener('change', () => {
      const settings = readSettingsFromUI();
      applySettingsToEditor(settings);
    });
  }

  if (settingElements.fontMono) {
    settingElements.fontMono.addEventListener('change', () => {
      const settings = readSettingsFromUI();
      applySettingsToEditor(settings);
    });
  }
}

/**
 * 初始化预设按钮
 */
export function initPresetButtons(presetHandler) {
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetHandler(btn.dataset.preset);
    });
  });
}
