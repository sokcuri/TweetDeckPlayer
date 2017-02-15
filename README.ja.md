# TweetDeck Player v2.20
Copyright (c) 2016-2017 Sokcuri, Dalgona, Gaeulbyul and other contributors
http://github.com/sokcuri/TweetDeckPlayer

> 最新リリースは[TweetDeck Playerのリリースページ](https://github.com/sokcuri/TweetDeckPlayer/releases)からダウンロードできます。  
> 更新履歴はChangeLog.mdファイルまたはTweetDeck Playerのリリースページを参照してください。

---

TweetDeck Playerは、[Electron](http://electron.atom.io/)ベースのTweetDeck専用ブラウザです。既存のウェブブラウザよりもっと軽く安定的に動作し、いろんな追加機能を加えてもっと便利に使用できます。また、ウェブブラウザと独立的にセッションを管理しているのでウェブブラウザとは別のアカウントでサインインできます。

ご使用中発生した不具合のご報告や質問はこちらへどうぞ。
https://github.com/sokcuri/TweetDeckPlayer/issues

# 要求スペック

- Window : 32/64bit
 - **Windows Vista以上が必要です** - ベースにしているElectron・ChromiumエンジンがWindows XPの対応を終了したため、Vista・７以上が必要です。
- Mac : 64bitのみ対応
- Linux : 32/64bit


# 追加機能一覧

- フォントの変更
- 正規表現(regex)によるフィルター機能
- ドラッグ&ドロップで画像の保存
- 画像をオリジナルサイズ(:orig)で保存
- 一部のツイートが表示されないバグを防ぐ
- unlink.isで始まるリンクを自動解析し元のリンクを表示
- いいね（♥）のアイコンを★に戻す
- リンク先を内蔵ブラウザで開く(shiftキーを押しながらリンクを選択すると外部ブラウザで開く)
- 簡単リツイート(shiftキーを押しながらリツイートするとリツイートウィンドウを表示する)
- Enter(return)キーで投稿
- 名前に絵文字を表示
- いいねと同時に画像の保存 (Macはoptionキー, Windows・LinuxはCtrlキーを押しながらふぁぼると保存しない）
- キーボード操作時のアニメーションの消去
- コラムのサイズのカスタマイズ

* unlink.isの解析・regexフィルター機能は設定の後アプリを再起動する必要があります。


# 追加機能の使用方法
- **追加機能の設定**
 - altキーを押して、表示されるメニューからFile→Settingの順で選択します。
 - または、TweetDeckの設定アイコンを右クリックし、Settingを選択します。
