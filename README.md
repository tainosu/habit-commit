# habit-commit

GitHub のコントリビューショングラフ風の「草」で、日々の習慣を可視化する PWA アプリです。
読書・筋トレなど習慣ごとに取り組んだ時間や回数を記録し、色の濃淡で積み重ねを確認できます。

## 主な機能

- メールアドレス + パスワードでのアカウント登録・ログイン（新規登録には招待コードが必要）
- 習慣の追加（単位は「分」または「回」、色を選択）
- 当日の記録（クイック入力ボタン付き。過去日は閲覧のみ）
- 月間カレンダーの草グラフ表示（記録量に応じて色の濃淡が変化）
- 習慣ごと / 全体のタブ切り替え
- 連続記録日数（ストリーク）の表示
- タイマー（計測した時間を「分」単位の習慣にそのまま記録）
- PWA 対応（スマホのホーム画面に追加してアプリとして利用可能）

## 技術スタック

| 分類 | 使用技術 |
|---|---|
| フロントエンド | React 19 / TypeScript / Vite |
| スタイル | Tailwind CSS v4 |
| バックエンド | Supabase（Auth / PostgreSQL / Row Level Security） |
| ホスティング | Vercel |

## ローカル開発

```bash
npm install
cp .env.example .env.local   # Supabase の URL とキーを記入
npm run dev
```

`.env.local` に設定する値は、Supabase ダッシュボードの「Connect」から確認できます。

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key>
```

### データベースの準備

Supabase ダッシュボードの SQL Editor で、以下を順に実行します。

1. `supabase/schema.sql`：テーブルと RLS ポリシーを作成
2. `supabase/invite_code.sql`：招待コードの検証を設定
3. 招待コードを登録（コードの値はリポジトリに含めない）

```sql
insert into invite_codes (code) values ('<招待コード>');
```

| テーブル | 内容 |
|---|---|
| `habits` | 習慣（名前・単位・色） |
| `habit_logs` | 日ごとの記録（日付・値） |
| `invite_codes` | 有効な招待コード（クライアントからは読み書き不可） |

ユーザー情報は Supabase Auth（`auth.users`）が管理し、各テーブルは `user_id` で紐づきます。RLS により、ユーザーは自分のデータのみ読み書きできます。

## デプロイ

GitHub の `main` ブランチへ push すると Vercel が自動でデプロイします。

- Vercel の Environment Variables に `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を設定（All Environments）
- 環境変数を変更した場合は Redeploy が必要（Vite はビルド時に値を埋め込むため）
- Supabase の Authentication → URL Configuration の Site URL / Redirect URLs に公開 URL を登録

## バージョン履歴

バージョンは [セマンティック バージョニング](https://semver.org/lang/ja/) に従います（`package.json` の `version` と揃える）。

- **MAJOR**：データ構造の変更など互換性のない変更
- **MINOR**：機能追加
- **PATCH**：バグ修正・細かな調整

### v1.4.0 (2026-10-31)

- 記録できるのを当日のみに制限（カレンダーの過去日はタップしても記録シートを開かない）

### v1.3.3 (2026-10-31)

- タイマーの表示を開始時から `00:00:00`（時:分:秒）形式に統一

### v1.3.2 (2026-10-31)

- タイマーの計測上限を3時間に設定（止め忘れ防止。上限に達すると自動で停止し、そのまま記録できる）

### v1.3.1 (2026-10-31)

- 読み込み中の表示をテキストからスピナーに変更

### v1.3.0 (2026-10-29)

- 記録シートに「タイマー」を追加（「手動入力」とタブ / 左右スワイプで切り替え）
  - 計測した時間を「分」単位の習慣の今日の記録として保存（30秒以上で四捨五入して1分〜）
  - 開始時刻ベースで計測するため、シートを閉じたりアプリを切り替えても計測が続く
  - 計測中は「記録する」ボタンに経過時間を表示
- 狭い画面（iPhone SE など）でヘッダーのボタンが折り返さないよう調整

### v1.2.0 (2026-10-29)

- ホーム画面アイコンを追加（コミットグラフから芽が伸びるデザイン）
  - `apple-touch-icon.png`（180px）、`icon-192.png` / `icon-512.png`（manifest 用）
- favicon を Vite のロゴから同デザインに差し替え

### v1.1.0 (2026-10-29)

- 新規登録に招待コードを追加（Supabase のトリガーでサーバー側で検証し、コードはユーザー情報に残さない）

### v1.0.0 (2026-10-27)

初回リリース。

- 習慣の登録・記録、月間カレンダーの草グラフ、ストリーク表示
- Supabase によるアカウント認証とクラウド保存（RLS で自分のデータのみアクセス可能）
- Vercel にデプロイし、スマホから PWA として利用可能に
