import * as vscode from 'vscode';

export class JavadocViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'javadocLens.previewView';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    // Scripts disabled — rendered Javadoc HTML is static content only
    webviewView.webview.options = { enableScripts: false };
    webviewView.webview.html = this.idleHtml();
  }

  /** Display a parsed Javadoc HTML page in the panel. */
  show(html: string): void {
    if (this._view) {
      this._view.webview.html = html;
    }
  }

  /** Show the default "waiting" message. */
  showIdle(): void {
    if (this._view) {
      this._view.webview.html = this.idleHtml();
    }
  }

  private idleHtml(): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline';">
  <style>
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-descriptionForeground, #888);
      background: var(--vscode-panel-background, #1e1e1e);
    }
    p { text-align: center; max-width: 280px; line-height: 1.6; }
  </style>
</head>
<body>
  <p>クラス・メソッド・フィールド名にカーソルを乗せると Javadoc が表示されます</p>
</body>
</html>`;
  }
}
