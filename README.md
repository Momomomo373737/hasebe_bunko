# 長谷部文庫

長谷部健司作品を静かに保存し、最初の一話から読み返す私設電子文庫です。HTML・CSS・JavaScriptとNode.js標準機能のみで動作し、外部依存、ログイン、Service Workerはありません。

カフェ編には第1〜5話の作品本文を収録しています。ほかの3シリーズにある第1話は**動作確認用サンプル**のため、実際の作品に差し替えるか削除してください。

## 初回セットアップ・GitHub Pages公開

1. GitHubでリポジトリを作成します。
2. **この `hasebe-library` フォルダの中身**をリポジトリのルートに置きます。隠しフォルダ `.github` も含めてください。
3. リポジトリの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択します。
4. `main` ブランチへcommit / pushします。既にpush済みなら、Actions → Publish library → Run workflowを実行します。
5. Actionsの「Publish library」が成功すると、Settings → Pagesに公開URLが表示されます。

GitHub Pagesは通常、公開URLを知る人が閲覧できます。このサイト自体に閲覧制限はありません。「私設文庫」という表示はアクセス制限を意味しません。利用できるリポジトリの可視性はGitHubのプランによります。

公開ページには検索エンジン向けの `noindex` を設定しています。検索結果への掲載を避けるための指定ですが、URLを知っている人の閲覧を防ぐアクセス制限ではありません。

[GitHub公式：公開元の設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 新しい話を追加

例えば `stories/cafe/028.js` を作成します。

```js
export default {
  number: 28,
  title: "第28話　いつもの午後",
  body: `ここから本文です。

空行や改行は、そのまま表示されます。
「こんにちは」
`
};
```

保存してcommit / pushすれば完了です。話数や一覧を手動編集する必要はありません。既存のファイル修正も同じ手順です。

- 必須項目は `number`（1以上の整数）、`title`、`body`だけです。
- 同じシリーズ内の話数は重複できません。欠番は許容し、前後リンクは存在する話をつなぎます。
- ファイル名よりも `number` の数字順を優先します。ファイルは `.js` にしてください。
- テンプレート文字列中のバッククォートは `\``、`${` は `\${`、バックスラッシュそのものは `\\` と書きます。
- 本文はHTMLとして解釈せず、文字列として安全に表示します。
- 日付の入力は不要です。本文は選択した1話だけを読み込みます。

## 新しいシリーズを追加

`stories/new-series/` に以下を置きます。

**series.js**

```js
export default {
  id: "new-series",
  title: "新シリーズ",
  description: "シリーズの説明",
  sort: 5
};
```

**001.js**には上記と同じ形式で第1話を書きます。commit / pushすると自動でトップページに追加されます。中央登録は不要です。

フォルダ名は半角小文字英数字・ハイフンを使用してください。`series.js` は `title` のみ必須です。`id` は省略可、指定する場合はフォルダ名と同じにします。`description`・`status`・`sort` は任意です。`sort` は小さい順、同じ値ならフォルダ名順です。

## ローカルで確認

Node.js 22以上をインストールし、このフォルダで実行します。依存パッケージのインストールは不要です。

```sh
npm run build
npm run preview
```

表示された `http://127.0.0.1:4173` をブラウザで開きます。編集後は再度 `npm run build` し、通常の再読み込みをします。プレビューの終了はCtrl+Cです。`index.html` の直接ダブルクリックでは動作しません。

```sh
npm test
```

自動検出、数字順、本文の保持、ハッシュの更新、重複・不正話数の検証を実行します。

## GitHub Actionsの仕組み

`.github/workflows/deploy-pages.yml` が `main` へのpush、または手動実行を受け付けます。

checkout → Node.js 22 → テスト → stories走査・検証 → manifest生成 → dist生成 → GitHub Pages公開、の順です。公開物は `dist` のみ。失敗時には新しい成果物を公開しません。`data/manifest.json` と `dist/` は自動生成されるためGit管理は不要です。

[GitHub公式：カスタムワークフロー](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## キャッシュ更新

- JS・CSS・一覧・各話のJSONに**内容のSHA-256ハッシュ**を含むファイル名を付けます。変更されたファイルは新しいURLになります。
- `index.html` の小さな起動処理が、毎回 `data/current.json` を `cache: 'no-store'` と毎回異なるクエリで取得します。ここに最新版のJS・CSS・manifestの参照があります。
- HTMLが以前のキャッシュから返っても、固定されたこの起動手順で最新版の参照を取得するため、旧ハッシュのJSを参照し続けません。この起動手順とcurrent.jsonの形式は将来も互換性を維持してください。
- ブラウザの「戻る」でページ全体が復元された場合にも更新を確認します。
- 開いたままの本文を途中で差し替えることはしません。通常のページ移動・再読み込みで反映します。
- Service Workerは登録しません。

**制約：** GitHub PagesのレスポンスヘッダーやCDN反映時間をサイト側から完全には制御できないため、公開完了直後の全世界での即時反映は保証できません。通常の反映後は強制再読み込みやキャッシュ削除を前提としません。デプロイの切り替わりと通信が重なる場合は通常の再読み込みで再試行できます。オフライン閲覧は非対応です。

## 続きから読む・URL

最後に正常表示したシリーズと話数を、この端末・ブラウザのlocalStorageへ保存します。ログイン不要ですが他の端末とは同期しません。保存が制限されたブラウザでも本文は閲覧できます。保存した話が削除された場合は、しおりを表示しません。

- トップ：`/リポジトリ名/`
- 話数一覧：`/リポジトリ名/?series=cafe`
- 第12話：`/リポジトリ名/?series=cafe&episode=12`

相対URLで参照するため、GitHub Pagesのリポジトリ配下でも動作します。SPAのパス書き換えや404回避設定は不要です。

## トラブル時

- **更新されない：** GitHub → Actions → 最新のPublish libraryを開き、build/deployの両方が成功しているか確認します。成功直後なら少し待って通常の再読み込みをしてください。
- **build失敗：** 赤いステップのログを確認します。JavaScriptの書式ミス、話数の重複、空のtitle/body、series.jsの欠落、idとフォルダ名の不一致などを修正してpushします。
- **deploy失敗：** Settings → PagesのSourceがGitHub Actionsか、Actionsが有効か、Environmentの承認待ちがないか確認します。
- **404：** 公開URLのリポジトリ名を確認します。ファイルを一段深いフォルダに入れず、package.jsonと.githubをリポジトリ直下に置いてください。
- **文庫を開けない：** 接続を確認し通常の再読み込みをしてください。表示できなかった本文を「読んだ話」として保存することはありません。
# hasebe_bunko
