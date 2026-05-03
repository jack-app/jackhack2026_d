import { useRef, useEffect, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

// MediaPipe の WASM バイナリを CDN から取得する URL
const WASM_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';

// 姿勢推定に使うモデルファイルの URL（lite = 軽量版、精度より速度優先）
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

// props: onVotes({ left, right }) — 毎フレーム呼ばれる
// left/right は「画面の左側・右側にいる人数」
// onHandRaised() — 全員が腕を上げた瞬間に呼ばれる
export default function PoseDetector({ onVotes, onHandRaised, hintText, disableHint }) {
  // DOM 参照
  const videoRef      = useRef(null);   // カメラ映像を流す <video> 要素
  const canvasRef     = useRef(null);   // 骨格描画用 <canvas> 要素（映像に重ねる）
  const landmarkerRef = useRef(null);   // PoseLandmarker インスタンスの保持
  const rafRef        = useRef(null);   // requestAnimationFrame の ID（クリーンアップ用）

  // onVotes を ref に入れておくことで、検出ループ内で常に最新のコールバックを参照できる
  // （useEffect の依存配列に onVotes を入れなくて済む）
  const onVotesRef    = useRef(onVotes);
  onVotesRef.current  = onVotes;

  const onHandRaisedRef = useRef(onHandRaised);
  onHandRaisedRef.current = onHandRaised;

  const disableHintRef = useRef(disableHint);
  disableHintRef.current = disableHint;

  const [status,        setStatus]        = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMsg,      setErrorMsg]      = useState(null);
  const [detections,    setDetections]    = useState([]);        // [{ side: 'left'|'right', armsRaised: bool }]
  const [allArmsRaised, setAllArmsRaised] = useState(false);     // 全員が腕を上げているか

  // カメラ起動: コンポーネントマウント時に一度だけ実行する
  useEffect(() => {
    let stream = null;
    (async () => {
      try {
        // フロントカメラ（selfie 側）を 640x480 で取得する
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        // カメラ権限が拒否された場合はエラー表示に切り替える
        setErrorMsg('カメラへのアクセスが許可されていません');
        setStatus('error');
      }
    })();
    // アンマウント時にカメラストリームを停止してリソースを解放する
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  // 全員が腕を上げたタイミングで onHandRaised を呼び出す
  useEffect(() => {
    if (allArmsRaised) {
      onHandRaisedRef.current?.();
    }
  }, [allArmsRaised]);

  // MediaPipe モデルの初期化: WASM をロードしてから PoseLandmarker を生成する
  useEffect(() => {
    (async () => {
      try {
        // WASM バイナリの場所を解決する（CDN から取得）
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);

        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU', // GPU が使えない環境では自動的に CPU にフォールバックする
          },
          runningMode: 'VIDEO', // 静止画ではなく動画（毎フレーム推論）モード
          numPoses: 6,          // 同時検出できる人数の上限
        });
        setStatus('ready');
      } catch (err) {
        console.error('PoseDetector init error:', err);
        setErrorMsg('AIモデルの読み込みに失敗しました');
        setStatus('error');
      }
    })();
  }, []);

  // 検出ループ: モデルの準備ができたら毎フレーム姿勢推定を実行する
  useEffect(() => {
    if (status !== 'ready') return;

    let isMounted = true;

    function detect() {
      if (!isMounted) return;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const lm     = landmarkerRef.current;

      // video.readyState >= 2 はフレームデータが取得可能な状態（HAVE_CURRENT_DATA 以上）
      if (video && canvas && lm && video.readyState >= 2) {
        // canvas サイズを映像の実サイズに合わせる（初回や解像度変化に対応）
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;

        // 現在のフレームに対して姿勢推定を実行する
        // performance.now() はフレームのタイムスタンプ（VIDEO モードでは必須）
        const result = lm.detectForVideo(video, performance.now());

        // 前フレームの描画を消してから新しい骨格を描く
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 左右判定の基準となる中央縦線を描画する
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth   = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.restore();

        const drawingUtils = new DrawingUtils(ctx);
        for (const landmarks of result.landmarks) {
          // 関節間の接続線（骨格ライン）を描画する
          drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
            color: 'rgba(255,255,255,0.5)', lineWidth: 1,
          });
          // 各関節点を描画する
          drawingUtils.drawLandmarks(landmarks, {
            color: '#fff', lineWidth: 1, radius: 3,
          });
        }

        // 検出された各人物について画面上の位置と腕の状態を判定する
        const persons = result.landmarks.map(landmarks => {
          const ls = landmarks[11]; // LEFT_SHOULDER
          const rs = landmarks[12]; // RIGHT_SHOULDER
          const lw = landmarks[15]; // LEFT_WRIST
          const rw = landmarks[16]; // RIGHT_WRIST

          // 映像が左右反転（scaleX(-1)）されているため、
          // MediaPipe の raw x > 0.5 が表示上の左側に対応する
          const centerX = (ls.x + rs.x) / 2;
          const side = centerX > 0.5 ? 'left' : 'right';

          // Y座標は下方向が正のため、手首のY < 肩のY なら腕が肩より上にある
          const armsRaised = lw.y < ls.y && rw.y < rs.y;

          return { side, armsRaised };
        });

        // 1人以上検出されていて、全員が腕を上げている場合にヒントを表示する
        const raised = persons.length > 0 && persons.every(p => p.armsRaised);

        setDetections(persons);
        setAllArmsRaised(!disableHintRef.current && raised);

        // 画面左側・右側にいる人数を集計して親コンポーネントに渡す
        onVotesRef.current?.({
          left:  persons.filter(p => p.side === 'left').length,
          right: persons.filter(p => p.side === 'right').length,
        });
      }

      // 次のフレームも同じ関数を呼び続けることで連続推論を実現する
      rafRef.current = requestAnimationFrame(detect);
    }

    if (isMounted) { 
        rafRef.current = requestAnimationFrame(detect);
      }
    // アンマウント時またはステータス変化時にループを止める
    return () => {
      isMounted = false; 
      cancelAnimationFrame(rafRef.current);
      
      try {
        const stream = videoRef.current?.srcObject;
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
      } catch (e) {
        console.warn("カメラ停止エラー (無視してOK):", e);
      }
    };
  }, [status]);

  return (
    <div style={styles.root}>
      {/* カメラ映像（transform: scaleX(-1) で左右反転して鏡のように見せる） */}
      <video ref={videoRef} autoPlay playsInline muted style={styles.video} />

      {/* 骨格オーバーレイ（映像と同じサイズ・位置に重ねる） */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {status === 'loading' && (
        <div style={styles.statusOverlay}>
          <p style={styles.statusText}>AIモデルを読み込み中…</p>
          <p style={styles.statusSub}>初回は30〜60秒かかります</p>
        </div>
      )}

      {status === 'error' && (
        <div style={styles.statusOverlay}>
          <p style={styles.errorText}>{errorMsg}</p>
        </div>
      )}

      {/* 全員が腕を上げたときにヒントをオーバーレイ表示する */}
      {allArmsRaised && (
        <div style={styles.hintOverlay}>
          <span style={styles.hintLabel}>ヒント</span>
          {hintText && <span style={styles.hintContent}>{hintText}</span>}
        </div>
      )}

      {/* 検出中の人数と各人物の位置を画面下部にバッジ表示する */}
      {status === 'ready' && (
        <div style={styles.badge}>
          <span style={styles.count}>{detections.length}人</span>
          {detections.map((p, i) => (
            <span 
              key={i} 
              style={{
                ...styles.lean, 
                // 💡 左なら #5DCAA5、右なら #E23636 に色を変える
                color: p.side === 'left' ? '#5DCAA5' : '#E23636' 
              }}
            >
              {p.side === 'left' ? '左' : '右'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000',
  },
  video: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%', objectFit: 'cover',
    transform: 'scaleX(-1)', // 鏡反転
  },
  canvas: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    transform: 'scaleX(-1)', // 映像と同じ向きに合わせる
  },
  statusOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)',
  },
  statusText: { fontSize: 14, color: '#ddd', margin: 0 },
  statusSub:  { fontSize: 11, color: '#888', marginTop: 6 },
  errorText:  { fontSize: 13, color: '#f87171', margin: 0 },
  badge: {
    position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '6px 14px',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  count: { fontSize: 13, color: '#aaa', fontFamily: 'monospace' },
  lean:  { fontSize: 13, color: '#ccc' },
  hintOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 16,
    background: 'rgba(0,0,0,0.6)',
    pointerEvents: 'none',
  },
  hintLabel: {
    fontSize: 48, fontWeight: 'bold', color: '#5DCAA5',
    textShadow: '0 0 20px rgba(93, 202, 165, 0.8)',
    letterSpacing: '0.1em',
  },
  hintContent: {
    fontSize: 28, fontWeight: 'bold', color: '#fff',
    textShadow: '0 0 16px rgba(255,255,255,0.7)',
    textAlign: 'center', padding: '0 24px', lineHeight: 1.5,
    maxWidth: '90%',
  },
};
