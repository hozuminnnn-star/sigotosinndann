# しごと発見ナビ

好きなこと・得意なこと・価値観・学校生活で頑張ったことを「選ぶだけ」で、向いていそうな仕事をランキング表示する高校生向けの静的サイトです。サーバー不要で、GitHub Pagesでそのまま公開できます。

## ファイル構成

| ファイル | 役割 |
| --- | --- |
| index.html | 画面の土台 |
| style.css | デザイン |
| data.js | 項目(好き・得意・価値観・学校生活)と職業のデータ。**編集はここ** |
| logic.js | スコア計算 |
| app.js | 画面の動き |

## GitHub Pagesで公開する手順

1. GitHubにログインし、右上の「+」→ **New repository**
2. Repository name に `shigoto-navi` など(英数字)を入力、**Public** を選び **Create repository**
3. 作成後の画面で **uploading an existing file** をクリックし、5つのファイル(README.md含め6つ)をドラッグ&ドロップ → **Commit changes**
4. リポジトリの **Settings → Pages** を開く
5. **Source** を `Deploy from a branch`、**Branch** を `main` / `(root)` にして **Save**
6. 1〜2分待つと `https://<ユーザー名>.github.io/shigoto-navi/` で公開されます

## 項目・職業の追加方法(data.js)

- 能力軸: A論理 / C創造 / H共感 / L統率 / P計画 / G挑戦 / T協調 / R探究 / E表現 / S誠実 / F柔軟
- 得意なこと: `["文章", "HE"]` のように軸コードを付ける
- 職業: `["名前","説明","A3R2H1","分野コード","働き方タグ"]`(数字は重み。大きいほどその力が重要)
- 分野コード: nat sci tech art media perf pop sport hosp mob beauty food build med care edu pub biz

## 注意

結果は選択内容をもとにした目安です。仕事選びの正解を決めるものではなく、考えるきっかけとして使ってください。
