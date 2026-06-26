import * as vscode from 'vscode';

export interface ExtractedJavadoc {
  rawComment: string;
  symbolName: string;
}

/**
 * Entry point: extract the Javadoc comment most relevant to the cursor position.
 *
 * Priority:
 *  1. Cursor is inside a /** … *\/ block in the current file → render that block
 *  2. Use vscode.executeDefinitionProvider → open the source file at the definition
 *     → find the /** … *\/ comment above the declaration
 *  3. Fallback: search backward from the cursor in the current file
 */
export async function extractJavadocAtCursor(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<ExtractedJavadoc | null> {

  // Case 1: cursor is inside a Javadoc comment block
  const inComment = extractCommentAroundCursor(document, position);
  if (inComment) return inComment;

  // Case 2: follow the definition to its source file
  const defLocation = await findDefinitionLocation(document, position);
  if (defLocation) {
    try {
      const defDoc = await vscode.workspace.openTextDocument(defLocation.uri);
      const defLine = defLocation.range.start.line;
      const raw = findJavadocAboveLine(defDoc, defLine);
      if (raw) {
        return { rawComment: raw, symbolName: symbolNameAt(defDoc, defLine) };
      }
    } catch {
      // source file not accessible
    }
  }

  // Case 3: look backward in the current file
  const raw = findJavadocAboveLine(document, position.line);
  if (raw) {
    return { rawComment: raw, symbolName: symbolNameAt(document, position.line) };
  }

  return null;
}

// ── Case 1: cursor inside a comment block ────────────────────────────────────

function extractCommentAroundCursor(
  document: vscode.TextDocument,
  position: vscode.Position
): ExtractedJavadoc | null {
  const lineText = document.lineAt(position.line).text;
  const trimmed = lineText.trim();

  // Must be on a comment line
  if (!trimmed.startsWith('*') && !trimmed.startsWith('/**') && !trimmed.includes('/**')) {
    return null;
  }

  // Find comment start (/**) going upward
  let startLine = position.line;
  while (startLine >= 0) {
    if (document.lineAt(startLine).text.includes('/**')) break;
    startLine--;
  }
  if (startLine < 0) return null;

  // Find comment end (*/) going downward
  let endLine = position.line;
  while (endLine < document.lineCount) {
    if (document.lineAt(endLine).text.includes('*/')) break;
    endLine++;
  }
  if (endLine >= document.lineCount) return null;

  const lines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(document.lineAt(i).text);
  }

  // Symbol name from the declaration that follows the comment
  const declLine = findDeclLineAfter(document, endLine + 1);
  const name = declLine !== -1 ? symbolNameAt(document, declLine) : '';

  return { rawComment: lines.join('\n'), symbolName: name };
}

function findDeclLineAfter(doc: vscode.TextDocument, fromLine: number): number {
  for (let i = fromLine; i < Math.min(fromLine + 5, doc.lineCount); i++) {
    const t = doc.lineAt(i).text.trim();
    if (t === '' || t.startsWith('@') || t.startsWith('//')) continue;
    return i;
  }
  return -1;
}

// ── Case 2: definition provider ──────────────────────────────────────────────

async function findDefinitionLocation(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<vscode.Location | null> {
  try {
    const results = await vscode.commands.executeCommand<
      Array<vscode.Location | vscode.LocationLink>
    >('vscode.executeDefinitionProvider', document.uri, position);

    if (!results || results.length === 0) return null;

    const first = results[0];
    if ('targetUri' in first) {
      // LocationLink
      return new vscode.Location(first.targetUri, first.targetRange);
    }
    return first as vscode.Location;
  } catch {
    return null;
  }
}

// ── Shared: find /** … */ above a declaration line ───────────────────────────

/**
 * Search backward from declLine, skipping blank lines and @Annotation lines,
 * to find a Javadoc comment (/** … *\/) immediately preceding the declaration.
 */
function findJavadocAboveLine(doc: vscode.TextDocument, declLine: number): string | null {
  let line = declLine - 1;

  // Skip blank lines and annotation lines
  while (line >= 0) {
    const t = doc.lineAt(line).text.trim();
    if (t === '' || t.startsWith('@')) {
      line--;
    } else {
      break;
    }
  }

  if (line < 0) return null;

  // The line must end a Javadoc comment
  if (!doc.lineAt(line).text.trim().endsWith('*/')) return null;

  const endLine = line;

  // Search for the opening /**
  while (line >= 0 && !doc.lineAt(line).text.includes('/**')) {
    line--;
  }
  if (line < 0 || !doc.lineAt(line).text.includes('/**')) return null;

  const lines: string[] = [];
  for (let i = line; i <= endLine; i++) {
    lines.push(doc.lineAt(i).text);
  }
  return lines.join('\n');
}

// ── Shared: extract symbol name from a declaration line ──────────────────────

function symbolNameAt(doc: vscode.TextDocument, line: number): string {
  if (line < 0 || line >= doc.lineCount) return '';
  const text = doc.lineAt(line).text;

  // class / interface / enum / record
  const typeDecl = /(?:class|interface|enum|record)\s+([\w$]+)/.exec(text);
  if (typeDecl) return typeDecl[1];

  // method or field: last word before ( or =  or ;
  const memberDecl = /(?:[\w<>\[\],\s]+)\s+([\w$]+)\s*[({;=]/.exec(text);
  if (memberDecl) return memberDecl[1];

  return '';
}
