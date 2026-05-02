# JackHack2026 — トロッコ問題クイズ AR

リアルタイムの姿勢検出（MediaPipe）とThree.js 3Dトロッコアニメーションを組み合わせた、観客参加型クイズアプリ。

---

## アーキテクチャ概要

```
App.jsx（状態管理・ゲームロジック）
 ├── Start.jsx              / ルート
 ├── Selector.jsx           /quiz（難易度未選択時）
 ├── QuizPage.jsx           /quiz（難易度選択済み）レイアウトシェル
 │    ├── QuizBoard.jsx          上段：問題・選択肢・タイマー表示
 │    ├── WhitchNarrator.jsx     左列：魔女キャラクター
 │    ├── ARPanel.jsx            中央：タイマー/votes ロジック + ARラッパー
 │    │    └── AR.jsx                3Dトロッコ + カメラ（実装済み）
 │    │         └── PoseDetector.jsx  MediaPipe 姿勢検出（実装済み）
 │    └── BatteryMeter.jsx       右列：バッテリー残量
 └── Finish.jsx             /finish
```

---

## コンポーネント一覧と TODO

### `src/App.jsx`
ゲーム全体の状態管理・ルーティング。
- **TODO**: `useHint()` の実装（battery −10、isHintVisible = true）

### `src/components/QuizPage.jsx`
3列レイアウトのシェル。ロジックなし。
- **TODO**: ARPanel から `timeLeft` を受け取り QuizBoard へ渡す（`onTimeChange` コールバックを ARPanel に追加して連携）

### `src/components/QuizBoard.jsx`
上段の問題UI（問題文・選択肢ボタン・ヒントボタン・タイマー表示）。
- **TODO**: タイマー（`timeLeft`）の表示スタイル（残り3秒以下で強調など）
- **TODO**: 選択肢ボタンのホバー・押下スタイル
- **TODO**: ヒントボタンの disabled スタイル
- **TODO**: 問題文・ヒントテキストのスタイル

### `src/components/ARPanel.jsx`
タイマー・votes・timeoutLabel のロジックと ARScene のラッパー。
- **TODO**: `timeLeft` state とカウントダウンを実装する
- **TODO**: `currentData` が変わったらタイマーをリセットする
- **TODO**: 時間切れ時に `latestVotesRef` の多数決で `onAnswer` を呼ぶ
- **TODO**: `handleVotesChange` コールバックを実装して ARScene の `onVotesChange` に渡す
- **TODO**: `timeoutLabel`（`'左'|'右'|null`）を state 管理して ARScene に渡す
- **TODO**: `pendingBranch` が null になったら `timeoutLabel` をクリアする
- **TODO**: `onTimeChange(timeLeft)` を外部に公開して QuizBoard と連携する

### `src/components/AR.jsx`
Three.js 3Dトロッコシーン・カメラ制御。**実装済み。**

### `src/components/PoseDetector.jsx`
MediaPipe PoseLandmarker による姿勢検出・左右分布・手上げ検知。**実装済み。**

### `src/components/BatteryMeter.jsx`
バッテリー残量の縦棒グラフ表示。
- **TODO**: 手上げ検知時（`onHandRaised`）に battery ≥ 10 なら battery を −10 する
- **TODO**: ヒントを表示する（`isHintVisible` を true にする）

### `src/components/WhitchNarrator.jsx`
左列の魔女キャラクター＋セリフバブル。
- **TODO**: セリフバブル・キャラクターのスタイルを実装する

### `src/components/Selector.jsx`
難易度選択画面（easy / hard）。**実装済み。**

### `src/components/Start.jsx` / `src/components/Finish.jsx`
スタート・フィニッシュ画面。**実装済み。**

---

## データフロー

### 問題データ（`App.jsx > QUESTIONS`）

```js
{
  id:               number,
  text:             string,      // 問題文
  choices:          [string, string],  // [左の選択肢, 右の選択肢]
  currentDirection: 'left' | 'right', // 正解の方向
  hint:             string,
  difficulty:       'easy' | 'hard',
}
```

**`choices[0]` = 左分岐、`choices[1]` = 右分岐** は固定。  
正解かどうかは `currentDirection` と選ばれた方向を比較して判定する。

### 正誤判定ロジック

```
ユーザーが choices[0] を選択 → branchDir = 'left'
ユーザーが choices[1] を選択 → branchDir = 'right'

isCorrect = (branchDir === question.currentDirection)
```

---

## 値の受け渡し（Props フロー）

### App.jsx → QuizPage.jsx

| prop | 型 | 説明 |
|---|---|---|
| `battery` | `number` | バッテリー残量（0〜100） |
| `currentData` | `Question` | 現在の問題オブジェクト |
| `onAnswer(choice, navigate)` | `fn` | 選択肢を選んだ時に呼ぶ |
| `onUseHint()` | `fn` | ヒントボタン押下時（battery −10） |
| `isHintVisible` | `boolean` | ヒント表示フラグ |
| `pendingBranch` | `'left'｜'right'｜null` | アニメーション待ちの分岐方向 |
| `onBranchComplete()` | `fn` | アニメーション完了後に呼ばれる |
| `questionIndex` | `number` | 現在の問題番号（1始まり） |
| `totalQuestions` | `number` | 総問題数 |
| `narrationLines` | `string[]` | 魔女のセリフ一覧 |

### QuizPage.jsx → AR.jsx

| prop | 型 | 説明 |
|---|---|---|
| `pendingBranch` | `'left'｜'right'｜null` | 分岐アニメーション起動指示 |
| `onBranchComplete()` | `fn` | アニメーション完了コールバック |
| `onHandRaised()` | `fn` | 両手を上げたらヒント表示へ中継 |
| `onVotesChange({left, right})` | `fn` | 最新の票数をQuizPageへ伝える |
| `timeoutLabel` | `'左'｜'右'｜null` | タイムアウト時に表示する方向文字 |

### AR.jsx → PoseDetector.jsx

| prop | 型 | 説明 |
|---|---|---|
| `onVotes({left, right})` | `fn` | 人体の左右分布を毎フレーム通知 |
| `onHandRaised()` | `fn` | 全員が手を上げた瞬間に呼ばれる |

---

## ゲームの状態管理（App.jsx）

### State

| state | 型 | 説明 |
|---|---|---|
| `battery` | `number` | バッテリー残量（0〜100） |
| `currentIndex` | `number` | 現在の問題インデックス |
| `difficulty` | `'easy'｜'hard'` | 選択中の難易度 |
| `status` | `'playing'｜'success'｜'failed'` | ゲーム結果 |
| `scene` | `'start'｜'quiz'｜'finish'` | 現在のシーン |
| `isHintVisible` | `boolean` | ヒント表示中か |
| `isDifficultySelected` | `boolean` | Selector を通過したか |
| `showSelector` | `boolean` | Selector を表示するか |
| `pendingBranch` | `'left'｜'right'｜null` | アニメーション待ちの分岐方向 |

### Ref

| ref | 説明 |
|---|---|
| `pendingNavigateRef` | アニメーション完了後に実行する `{ navigate, fn }` を保持 |

---

## 回答から画面遷移までの流れ

```
1. ユーザーがボタン押下 or タイムアウト
       ↓
2. QuizPage: onAnswer(choice, navigate) 呼び出し
       ↓
3. App: handleAnswer
   - branchDir = choice === choices[0] ? 'left' : 'right'
   - isCorrect = branchDir === currentDirection
   - setPendingBranch(branchDir)          ← ARアニメーション起動
   - pendingNavigateRef.current = { navigate, fn: ... }  ← 後処理を保存
       ↓
4. AR.jsx: pendingBranch を検知してトロッコ分岐アニメーション開始
   - branch フェーズ（3秒）→ return-arc フェーズ（5秒）→ return-straight フェーズ（2.5秒）
       ↓
5. return-straight 完了時: onBranchComplete() 呼び出し
       ↓
6. App: handleBranchComplete
   - battery −5（問題1問ごとのエネルギー消費）
   - pendingNavigateRef.current.fn(navigate) を実行
     - 正解: battery加算、次の問題へ or /finish(success)
     - 不正解: /finish(failed)
   - setPendingBranch(null)
```

---

## タイムアウト時の挙動

10秒経過した時点で、PoseDetector が検出している人体の左右分布（票数）を多数決で分岐方向を決定する。

```
latestVotesRef.current = { left: N, right: M }  ← AR から毎フレーム更新
タイムアウト時:
  goLeft = left >= right
  timedOutChoice = goLeft ? choices[0] : choices[1]
  setTimeoutLabel(goLeft ? '左' : '右')          ← ARに大きな文字で表示
  onAnswer(timedOutChoice, navigate)             ← 通常の回答フローへ
```

---

## バッテリー増減表

| イベント | 変化 | 実装場所 |
|---|---|---|
| 正解（easy） | +5 | `App.jsx` handleAnswer |
| 正解（hard） | +20 | `App.jsx` handleAnswer |
| 問題完了（トロッコ1周） | −5 | `App.jsx` handleBranchComplete |
| ヒント使用（手を上げる） | −10 | **TODO: `BatteryMeter.jsx`** |

### 手上げ → ヒント表示のデータフロー

```
PoseDetector.jsx  allArmsRaised 検知
    ↓ onHandRaised()
AR.jsx            prop を中継
    ↓ onHandRaised
ARPanel.jsx       onUseHint として ARScene へ渡す
    ↓ onUseHint → useHint() in App.jsx
App.jsx           useHint() ← ここから先は TODO
    ↓ (TODO)
BatteryMeter.jsx  battery −10 / isHintVisible = true を実装予定
```

---

## 技術スタック

| ライブラリ | 用途 |
|---|---|
| React 19 | UIフレームワーク |
| React Router DOM v7 | ページ遷移（`/`, `/quiz`, `/finish`） |
| Three.js + @react-three/fiber | 3Dトロッコ・レール描画 |
| @mediapipe/tasks-vision | リアルタイム姿勢検出（PoseLandmarker） |
| Vite | ビルドツール |
