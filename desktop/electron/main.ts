import { app, BrowserWindow, desktopCapturer, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";

// 現在のモジュールのディレクトリパスを取得（ESモジュール用）
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ビルド後のディレクトリ構造
//
// ├─┬─┬ dist                 # レンダラープロセスのビルド成果物
// │ │ └── index.html         # メインのHTMLファイル
// │ │
// │ ├─┬ dist-electron        # メインプロセスのビルド成果物
// │ │ ├── main.js            # メインプロセスのエントリーポイント
// │ │ └── preload.mjs        # プリロードスクリプト
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// Vite開発サーバーのURLを環境変数から取得（Vite@2.xのdefineプラグインを回避）
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

// パブリックリソースのパスを設定（開発時はpublicディレクトリ、本番時はdistディレクトリを使用）
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// メインウィンドウとサブウィンドウの参照を保持する変数
let win: BrowserWindow | null;
let studio: BrowserWindow | null;
let floatingWebCam: BrowserWindow | null;

// メインウィンドウとサブウィンドウを作成する関数
function createWindow() {
  // メインウィンドウの設定
  win = new BrowserWindow({
    width: 500,
    height: 600,
    minHeight: 600,
    minWidth: 300,
    hasShadow: false,
    frame: false, // ウィンドウのタイトルバーと枠を非表示
    transparent: true, // ウィンドウの背景を透明に
    alwaysOnTop: true, // 他のウィンドウの前面に表示
    focusable: true, // フォーカス可能
    icon: path.join(process.env.VITE_PUBLIC, "opal-logo.svg"), // アプリケーションアイコン
    webPreferences: {
      nodeIntegration: false, // Node.js APIへのアクセスを無効化（セキュリティ）
      contextIsolation: true, // プリロードスクリプトとレンダラーのコンテキストを分離（セキュリティ）
      devTools: true, // 開発者ツールを有効化
      preload: path.join(__dirname, "preload.mjs"), // プリロードスクリプトのパス
    },
  });

  // Studioウィンドウの設定（ビデオ編集用）
  studio = new BrowserWindow({
    width: 400,
    height: 200,
    minHeight: 70,
    maxHeight: 400,
    minWidth: 300,
    maxWidth: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false, // フォーカス不可
    icon: path.join(process.env.VITE_PUBLIC, "opal-logo.svg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // Webカメラウィンドウの設定
  floatingWebCam = new BrowserWindow({
    width: 200,
    height: 200,
    minHeight: 20,
    maxHeight: 200,
    minWidth: 200,
    maxWidth: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false,
    icon: path.join(process.env.VITE_PUBLIC, "opal-logo.svg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // ウィンドウの表示設定（全ワークスペースで表示）
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(true, "screen-saver", 1);
  studio.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  studio.setAlwaysOnTop(true, "screen-saver", 1);
  floatingWebCam.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  floatingWebCam.setAlwaysOnTop(true, "screen-saver", 1);

  // メインウィンドウのコンテンツ読み込み完了時の処理
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Studioウィンドウのコンテンツ読み込み完了時の処理
  studio.webContents.on("did-finish-load", () => {
    studio?.webContents.send(
      "main-process-message",
      new Date().toLocaleString()
    );
  });

  // 開発環境と本番環境でのURL/ファイルの読み込み処理
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL); // 開発サーバーのURLを読み込み
    studio.loadURL(`${import.meta.env.VITE_APP_URL}/studio.html`);
    floatingWebCam.loadURL(`${import.meta.env.VITE_APP_URL}/webcam.html`);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html")); // 本番用のHTMLファイルを読み込み
    studio.loadFile(path.join(RENDERER_DIST, "studio.html"));
    floatingWebCam.loadFile(path.join(RENDERER_DIST, "webcam.html"));
  }
}

// アプリ終了処理（macOS以外ではウィンドウを閉じるとアプリが終了）
ipcMain.on("closeApp", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
    studio = null;
    floatingWebCam = null;
  }
});

// デスクトップキャプチャのソースを取得する処理
ipcMain.handle("getSources", async () => {
  try {
    return await desktopCapturer.getSources({
      thumbnailSize: {
        height: 100,
        width: 150,
      },
      fetchWindowIcons: true,
      types: ["window", "screen"],
    });
  } catch (error) {
    console.error("Failed to get sources:", error);
    return [];
  }
});

// メディアソースの受信処理（Studioウィンドウにプロファイルデータを転送）
ipcMain.on("media-sources", async (_, payload) => {
  studio?.webContents.send("profile-received", payload);
});

// Studioウィンドウのリサイズ処理（ペイロードに基づいてサイズを変更）
ipcMain.on("resize-studio", (_, payload) => {
  const newSize = payload.shrink ? 100 : 250;
  studio?.setSize(400, newSize);
});

// プラグインの非表示処理（メインウィンドウに非表示指示を転送）
ipcMain.on("hide-plugin", (_, payload) => {
  win?.webContents.send("hide-plugin", payload);
});

// 全てのウィンドウが閉じられた時の処理（macOS以外ではアプリを終了）
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
    studio = null;
    floatingWebCam = null;
  }
});

// アプリのアクティベート処理（macOS用：ドックアイコンクリック時のウィンドウ再作成）
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// アプリの準備が完了したらウィンドウを作成
app.whenReady().then(createWindow);
