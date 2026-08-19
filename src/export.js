/* ========================================
   MiniMD — 导出功能（HTML / PDF）
   ======================================== */

/**
 * 导出为 HTML 文件
 * @param {string} title - 文档标题
 * @param {string} html - 渲染后的 HTML 内容
 * @param {object} settings - 排版设置
 */
export function exportHTML(title, htmlContent, settings) {
  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { font-size: 16px; -webkit-font-smoothing: antialiased; }
    body {
      font-family: ${settings.fontFamily};
      font-size: ${settings.fontSize}px;
      line-height: ${settings.lineHeight};
      color: ${settings.textColor};
      max-width: ${settings.maxWidth}px;
      margin: 0 auto;
      padding: ${settings.padding}px;
    }
    h1 { font-size: ${settings.h1Size}px; font-weight: 700; margin: 0.4em 0 0.5em; line-height: 1.3; }
    h2 { font-size: ${settings.h2Size}px; font-weight: 600; margin: 0.5em 0 0.4em; line-height: 1.35; }
    h3 { font-size: ${settings.h3Size}px; font-weight: 600; margin: 0.5em 0 0.3em; line-height: 1.4; }
    h4, h5, h6 { font-size: ${settings.fontSize}px; font-weight: 600; margin: 0.5em 0 0.3em; line-height: 1.4; }
    p { margin: 0 0 ${settings.paragraphSpacing}px; }
    a { color: ${settings.linkColor}; text-decoration: underline; text-decoration-color: rgba(85,85,85,0.3); }
    a:hover { text-decoration-color: ${settings.linkColor}; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    del { text-decoration: line-through; color: #999; }
    ul, ol { margin: 0 0 ${settings.paragraphSpacing}px; padding-left: 1.5em; }
    li { margin-bottom: 0.3em; }
    blockquote {
      margin: 0 0 ${settings.paragraphSpacing}px;
      padding: 0.5em 0 0.5em 1em;
      border-left: 3px solid ${settings.quoteColor};
      color: #666;
    }
    code {
      font-family: ${settings.fontMono};
      font-size: 0.9em;
      background: ${settings.codeBg};
      padding: 0.15em 0.4em;
      border-radius: 2px;
    }
    pre {
      margin: 0 0 ${settings.paragraphSpacing}px;
      padding: 16px;
      background: ${settings.codeBg};
      border-radius: 2px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; font-size: 0.875em; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 1.5em 0; }
    img { max-width: 100%; height: auto; margin: 0.5em 0; }
    table { width: 100%; border-collapse: collapse; margin: 0 0 ${settings.paragraphSpacing}px; }
    th, td { padding: 8px 12px; border: 1px solid #e0e0e0; text-align: left; }
    th { font-weight: 600; background: #fafafa; }
    tr:nth-child(even) { background: #fafafa; }
    ul.task-list { list-style: none; padding-left: 0; }
    ul.task-list li { display: flex; align-items: flex-start; gap: 8px; }
    ul.task-list li input[type="checkbox"] { margin-top: 0.3em; }
    @media (max-width: 768px) {
      body { padding: 16px; max-width: 100%; }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: 'text/html; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'document'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 导出为 PDF（通过 window.print）
 */
export function exportPDF() {
  window.print();
}

/**
 * HTML 转义
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 获取编辑器预览区的 HTML（用于导出）
 * @param {HTMLElement} [previewEl] - 可选的预览元素引用
 */
export function getExportHTML(previewEl) {
  const preview = previewEl || document.getElementById('editor');
  return preview ? preview.innerHTML : '';
}
