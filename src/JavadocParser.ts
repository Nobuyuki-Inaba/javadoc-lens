/**
 * Convert a raw /** … *\/ Javadoc comment string into a self-contained HTML page
 * ready for display in a VS Code WebviewView.
 *
 * Processing steps:
 *  1. Strip /** and *\/ delimiters, strip leading " * " from each line
 *  2. Split into description (HTML) and block-tag section (@param, @return, …)
 *  3. Process inline tags ({@code}, {@link}, {@literal}) in the description
 *  4. Render block tags as structured HTML sections
 *  5. Wrap in a minimal HTML page that uses VS Code CSS variables for theming
 */
export function parseJavadocToHtml(rawComment: string, symbolName: string): string {
  const lines = stripDelimiters(rawComment);
  const { descLines, tags } = splitDescAndTags(lines);

  const description = processInlineTags(descLines.join('\n').trim());
  const sections    = renderBlockTags(tags);

  return buildPage(symbolName, description, sections);
}

// ── Step 1: strip delimiters ─────────────────────────────────────────────────

function stripDelimiters(raw: string): string[] {
  return raw
    .replace(/^\s*\/\*\*\s*\n?/, '')   // opening /**
    .replace(/\s*\*\/\s*$/, '')         // closing */
    .split('\n')
    .map(l => l.replace(/^\s*\*\s?/, '')); // leading " * "
}

// ── Step 2: split description vs. block tags ─────────────────────────────────

interface BlockTag { tag: string; content: string; }

function splitDescAndTags(lines: string[]): { descLines: string[]; tags: BlockTag[] } {
  const descLines: string[] = [];
  const tags: BlockTag[] = [];
  let current: BlockTag | null = null;
  let seenTag = false;

  for (const line of lines) {
    const tagMatch = /^\s*@(\w+)\s*(.*)/.exec(line);
    if (tagMatch) {
      seenTag = true;
      if (current) tags.push(current);
      current = { tag: tagMatch[1], content: tagMatch[2] };
    } else if (seenTag && current) {
      // continuation line of the current block tag
      current.content += '\n' + line;
    } else {
      descLines.push(line);
    }
  }
  if (current) tags.push(current);

  return { descLines, tags };
}

// ── Step 3: inline tags ──────────────────────────────────────────────────────

function processInlineTags(text: string): string {
  return text
    // {@code ...} — content is treated as literal text (HTML-escaped)
    .replace(/\{@code\s([\s\S]*?)\}/g, (_, inner) => `<code>${esc(inner)}</code>`)
    // {@literal ...} — escape HTML
    .replace(/\{@literal\s([\s\S]*?)\}/g, (_, inner) => esc(inner))
    // {@link[plain] pkg.Class#member optional label}
    .replace(/\{@link(?:plain)?\s+([\w.#()[\],\s]+?)(?:\s+([^}]+))?\}/g,
      (_, ref, label) => `<code>${esc(label?.trim() ?? ref.trim())}</code>`)
    // {@value ref} — show as code
    .replace(/\{@value\s*(.*?)\}/g, (_, ref) => `<code>${esc(ref.trim())}</code>`);
}

// ── Step 4: block tags → HTML ─────────────────────────────────────────────────

function renderBlockTags(tags: BlockTag[]): string {
  if (tags.length === 0) return '';

  const params     = tags.filter(t => t.tag === 'param');
  const returns    = tags.find(t => t.tag === 'return' || t.tag === 'returns');
  const throwsList = tags.filter(t => t.tag === 'throws' || t.tag === 'exception');
  const deprecated = tags.find(t => t.tag === 'deprecated');
  const since      = tags.find(t => t.tag === 'since');
  const authors    = tags.filter(t => t.tag === 'author');
  const sees       = tags.filter(t => t.tag === 'see');

  const html: string[] = [];

  if (deprecated) {
    html.push(
      `<div class="deprecated-block">` +
      `<span class="deprecated-label">非推奨:</span> ` +
      `${processInlineTags(deprecated.content.trim())}` +
      `</div>`
    );
  }

  if (params.length > 0) {
    const rows = params.map(p => {
      const m = /^(\S+)\s*(.*)/.exec(p.content.trim());
      return m
        ? `<dt><code class="param-name">${esc(m[1])}</code></dt><dd>${processInlineTags(m[2].trim())}</dd>`
        : `<dt></dt><dd>${processInlineTags(p.content.trim())}</dd>`;
    }).join('');
    html.push(`<dl><dt class="section-label">パラメータ:</dt>${rows}</dl>`);
  }

  if (returns) {
    html.push(
      `<dl><dt class="section-label">戻り値:</dt>` +
      `<dd>${processInlineTags(returns.content.trim())}</dd></dl>`
    );
  }

  if (throwsList.length > 0) {
    const rows = throwsList.map(t => {
      const m = /^(\S+)\s*(.*)/.exec(t.content.trim());
      return m
        ? `<dt><code>${esc(m[1])}</code></dt><dd>${processInlineTags(m[2].trim())}</dd>`
        : `<dt></dt><dd>${processInlineTags(t.content.trim())}</dd>`;
    }).join('');
    html.push(`<dl><dt class="section-label">例外:</dt>${rows}</dl>`);
  }

  if (since) {
    html.push(
      `<dl><dt class="section-label">導入バージョン:</dt>` +
      `<dd>${esc(since.content.trim())}</dd></dl>`
    );
  }

  if (authors.length > 0) {
    html.push(
      `<dl><dt class="section-label">作成者:</dt>` +
      `<dd>${authors.map(a => esc(a.content.trim())).join(', ')}</dd></dl>`
    );
  }

  if (sees.length > 0) {
    const items = sees.map(s => processInlineTags(s.content.trim())).join(', ');
    html.push(`<dl><dt class="section-label">関連項目:</dt><dd>${items}</dd></dl>`);
  }

  return html.join('\n');
}

// ── Step 5: wrap in HTML page ────────────────────────────────────────────────

function buildPage(symbolName: string, description: string, sections: string): string {
  const heading = symbolName ? `<h2>${esc(symbolName)}</h2>` : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline';">
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-editor-foreground, #ccc);
      background: var(--vscode-panel-background, #1e1e1e);
      margin: 0;
      padding: 12px 16px;
      line-height: 1.65;
    }
    h2 {
      font-size: 1em;
      font-weight: bold;
      margin: 0 0 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid var(--vscode-panel-border, #444);
      color: var(--vscode-symbolIcon-classForeground, #4ec9b0);
    }
    code {
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.92em;
      background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.2));
      padding: 1px 4px;
      border-radius: 3px;
    }
    pre {
      background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.2));
      padding: 8px 12px;
      overflow-x: auto;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.9em;
      white-space: pre-wrap;
    }
    pre code { background: none; padding: 0; }
    p { margin: 4px 0 8px; }
    ul, ol { padding-left: 20px; margin: 4px 0 8px; }
    table { border-collapse: collapse; margin: 6px 0; font-size: 0.92em; }
    th, td {
      border: 1px solid var(--vscode-panel-border, #444);
      padding: 4px 8px;
    }
    th { background: rgba(128,128,128,0.15); font-weight: bold; }
    a { color: var(--vscode-textLink-foreground, #4eadea); }
    dl { margin: 4px 0 8px; padding: 0; }
    dt.section-label {
      font-weight: bold;
      margin-top: 10px;
      color: var(--vscode-descriptionForeground, #999);
      font-size: 0.88em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    dt code.param-name { font-style: italic; }
    dd { margin: 2px 0 4px 16px; }
    .deprecated-block {
      border-left: 3px solid #f0ad4e;
      padding: 4px 10px;
      margin-bottom: 10px;
      background: rgba(240,173,78,0.08);
    }
    .deprecated-label { font-weight: bold; color: #e07c00; }
    b, strong { font-weight: bold; }
    i, em { font-style: italic; }
  </style>
</head>
<body>
  ${heading}
  <div class="description">${description}</div>
  ${sections ? `<div class="sections">${sections}</div>` : ''}
</body>
</html>`;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
