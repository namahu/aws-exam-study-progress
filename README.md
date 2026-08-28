# AWS Exam Study Progress

「AWS認定資格 WEB問題集＆徹底解説（aws-exam.net）」での学習進捗や正答率を自動記録・可視化する Chrome 拡張機能（Manifest V3）です。

各問題の回答結果（正解/不正解、分野）を自動取得してローカルに保存し、問題一覧画面での回答ステータスバッジの表示や、ポップアップでの日別・週別正答率および分野別内訳の確認が可能です。

---

## 🌟 主な機能

### 1. 回答結果の自動記録（Content Script）
- `https://aws-exam.net/*` の問題回答後の結果画面から、問題ID、所属分野タグ、正解/不正解を自動で判別して記録します。
- 試験ID（SAA、SAP、DVA などURLパスから判別）ごとに自動でデータを分類して保存します。
- 短時間の連続送信による重複登録を防止するガード処理（10秒以内の重複判定）を備えています。

### 2. 問題一覧画面での回答済みバッジ表示
- 分野別の問題一覧ページ（`_q_category.php`）内の各問題リンクに、過去の回答ステータスバッジを動的に挿入します。
  - **回答済み（正解）**（青色バッジ）
  - **回答済み（不正解）**（赤色バッジ）
- ページの動的更新（SPA/DOM変化）にも MutationObserver により自動追従します。

### 3. 学習実績ポップアップ（Popup UI）
- **試験切り替え**: 過去に回答履歴のある試験をプルダウンから選択可能。
- **今日の実績（Daily Summary）**:
  - 当日の総回答数・正答数・正答率を表示（正答率 70% 以上で緑、未満で赤）。
  - 分野ごとの内訳（正答率・回答数・正答数）をアコーディオン形式で確認可能。
- **直近7日間の実績（Weekly Summary）**:
  - 過去1週間（今日を含む7日間）の総回答数・正答数・正答率、および分野別内訳を表示。

### 4. データのローカル管理・検証
- `chrome.storage.local` によるブラウザ内永続化。
- Zod によるデータスキーマ定義・型安全性およびインポート時のバリデーション。

---

## 🛠 技術スタック

| カテゴリ | 技術 / ライブラリ |
| :--- | :--- |
| **拡張仕様** | Chrome Extensions Manifest V3 |
| **フロントエンド** | React 19, TypeScript |
| **スタイリング** | Tailwind CSS v4 (`@tailwindcss/vite`) |
| **ビルド / 開発環境** | Vite 8, CRXJS Vite Plugin (`@crxjs/vite-plugin`) |
| **スキーマ・検証** | Zod v4 |
| **パッケージング** | vite-plugin-zip-pack |

---

## 📁 ディレクトリ構成

```text
aws-exam-study-progress/
├── public/                 # 拡張機能アイコンなどの静的アセット
├── src/
│   ├── content/            # Content Script（結果記録・一覧へのバッジ注入）
│   │   ├── content.ts
│   │   └── content.css
│   ├── popup/              # ポップアップ画面（React + Tailwind CSS）
│   │   ├── app/            # ルートレイアウトコンポーネント
│   │   ├── features/       # サマリー表示（日別・週別）等の機能コンポーネント
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── index.html
│   ├── storage.ts          # chrome.storage 連携・データ集計・インポート/エクスポート
│   └── types.ts            # Zod スキーマおよび TypeScript 型定義
├── manifest.config.ts      # CRXJS 用 Chrome 拡張マニフェスト設定
├── vite.config.ts          # Vite ビルド設定
├── package.json
└── tsconfig.json
```

---

## 🚀 開発・ビルド手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

### 3. Chrome への拡張機能読み込み（開発時）

1. Google Chrome を開き、アドレスバーに `chrome://extensions/` を入力して開きます。
2. 右上の **「デベロッパーモード」** を有効にします。
3. **「パッケージ化されていない拡張機能を読み込む」** をクリックし、本プロジェクトの `dist` ディレクトリを選択します。

### 4. プロダクションビルド

```bash
npm run build
```

- `dist/` ディレクトリにビルド済みファイルが出力されます。
- `release/` 配下に配布用の ZIP ファイル（`crx-aws-exam-study-progress-1.0.0.zip` など）が自動生成されます。
