import * as vscode from 'vscode';
import { JavadocViewProvider } from './JavadocViewProvider';
import { extractJavadocAtCursor } from './JavadocExtractor';
import { parseJavadocToHtml } from './JavadocParser';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new JavadocViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      JavadocViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // ── Commands ─────────────────────────────────────────────────────────────

  context.subscriptions.push(
    vscode.commands.registerCommand('javadocLens.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'javadocLens');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('javadocLens.refreshView', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) triggerLookup(editor.document, editor.selection.active);
    })
  );

  // ── Cursor tracking ───────────────────────────────────────────────────────

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function triggerLookup(doc: vscode.TextDocument, pos: vscode.Position): void {
    clearTimeout(debounceTimer);
    const ms = vscode.workspace
      .getConfiguration('javadocLens')
      .get<number>('debounceMs', 400);
    debounceTimer = setTimeout(() => void performLookup(doc, pos), ms);
  }

  async function performLookup(
    doc: vscode.TextDocument,
    pos: vscode.Position
  ): Promise<void> {
    if (doc.languageId !== 'java') {
      provider.showIdle();
      return;
    }

    const extracted = await extractJavadocAtCursor(doc, pos);
    if (!extracted) {
      provider.showIdle();
      return;
    }

    provider.show(parseJavadocToHtml(extracted.rawComment, extracted.symbolName));
  }

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(event => {
      const { kind } = event;
      if (
        kind === vscode.TextEditorSelectionChangeKind.Mouse ||
        kind === vscode.TextEditorSelectionChangeKind.Keyboard ||
        kind === undefined
      ) {
        triggerLookup(event.textEditor.document, event.selections[0].active);
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) triggerLookup(editor.document, editor.selection.active);
      else provider.showIdle();
    })
  );

  // Trigger once on activation if a Java file is already open
  const init = vscode.window.activeTextEditor;
  if (init?.document.languageId === 'java') {
    triggerLookup(init.document, init.selection.active);
  }
}

export function deactivate(): void {}
