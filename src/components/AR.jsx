import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import PoseDetector from './PoseDetector';

const lerp = (a, b, t) => a + (b - a) * t;

export const TRACK_Y  = -5.0;
export const RAIL_X   = 5.0;
export const CART_W   = 11.0;

const BRANCH_DURATION          = 3000;
const RETURN_ARC_DURATION      = 5000;
const RETURN_STRAIGHT_DURATION = 2500;

// ─── 完璧な「2つくっついた長方形」を描くための寸法パラメータ ───────────
const PATH_PARAMS = {
  R: 12,              // 角の丸み（半径）
  W: 42,              // ループの横幅（中心から一番外側のレールまで）
  Z_TOP: -100,        // 長方形の一番上のZ座標
  Z_BOTTOM: 0,        // 長方形の一番下のZ座標
  INITIAL_Z: -82      // トロッコの初期位置（分岐 Z=-88 の少し手前）
};

// ─── トロッコのアニメーション用軌道計算 ────────────────────────
function getCartPoint(dir, phase, t) {
  const { R, W, Z_TOP, Z_BOTTOM, INITIAL_Z } = PATH_PARAMS;
  const sign = dir === 'left' ? -1 : 1;
  const lenArc = (Math.PI * R) / 2;
  const lenStrH = W - 2 * R;
  const lenStrV = Math.abs((Z_BOTTOM - R) - (Z_TOP + R)); 
  
  if (phase === 'branch') {
    const lenStr0 = Math.abs(INITIAL_Z - (Z_TOP + R));
    const total = lenStr0 + lenArc * 2 + lenStrH;
    const d = t * total;
    
    if (d <= lenStr0) {
      return { x: 0, z: INITIAL_Z - d };
    } else if (d <= lenStr0 + lenArc) {
      const a = ((d - lenStr0) / lenArc) * (Math.PI / 2);
      return { x: sign * (R - R * Math.cos(a)), z: (Z_TOP + R) - R * Math.sin(a) };
    } else if (d <= lenStr0 + lenArc + lenStrH) {
      const s = d - lenStr0 - lenArc;
      return { x: sign * (R + s), z: Z_TOP };
    } else {
      const a = ((d - lenStr0 - lenArc - lenStrH) / lenArc) * (Math.PI / 2);
      return { x: sign * ((W - R) + R * Math.sin(a)), z: Z_TOP + R * (1 - Math.cos(a)) };
    }
  } else if (phase === 'return-arc') {
    const total = lenStrV + lenArc * 2 + lenStrH;
    const d = t * total;
    
    if (d <= lenStrV) {
      return { x: sign * W, z: (Z_TOP + R) + d };
    } else if (d <= lenStrV + lenArc) {
      const a = ((d - lenStrV) / lenArc) * (Math.PI / 2);
      return { x: sign * (W - R * (1 - Math.cos(a))), z: (Z_BOTTOM - R) + R * Math.sin(a) };
    } else if (d <= lenStrV + lenArc + lenStrH) {
      const s = d - lenStrV - lenArc;
      return { x: sign * ((W - R) - s), z: Z_BOTTOM };
    } else {
      const ratio = Math.min(1, Math.max(0, (d - lenStrV - lenArc - lenStrH) / lenArc));
      const a = ratio * (Math.PI / 2);
      return { x: sign * (R - R * Math.sin(a)), z: Z_BOTTOM - R * (1 - Math.cos(a)) };
    }
  }
}

function getCartTangent(dir, phase, t) {
  const delta = 0.0001;
  let t1 = Math.max(0, t - delta);
  let t2 = Math.min(1, t + delta);
  if (t === 0) t2 = delta * 2;
  if (t === 1) t1 = 1 - delta * 2;
  
  const p1 = getCartPoint(dir, phase, t1);
  const p2 = getCartPoint(dir, phase, t2);
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len === 0) return { x: 0, z: -1 };
  return { x: dx / len, z: dz / len };
}

// ─── 外周レールの描画用計算 ──────────────────────────────
function getOuterLoopPoint(dir, t) {
  const { R, W, Z_TOP, Z_BOTTOM } = PATH_PARAMS;
  const sign = dir === 'left' ? -1 : 1;
  const lenArc = (Math.PI * R) / 2;
  const lenStrH = W - 2 * R;
  const lenStrV = Math.abs((Z_BOTTOM - R) - (Z_TOP + R));
  
  const total = lenArc * 4 + lenStrH * 2 + lenStrV;
  const d = t * total;
  
  if (d <= lenArc) {
    const a = (d / lenArc) * (Math.PI / 2);
    return { x: sign * (R - R * Math.cos(a)), z: (Z_TOP + R) - R * Math.sin(a) };
  } else if (d <= lenArc + lenStrH) {
    const s = d - lenArc;
    return { x: sign * (R + s), z: Z_TOP };
  } else if (d <= lenArc * 2 + lenStrH) {
    const a = ((d - lenArc - lenStrH) / lenArc) * (Math.PI / 2);
    return { x: sign * ((W - R) + R * Math.sin(a)), z: Z_TOP + R * (1 - Math.cos(a)) };
  } else if (d <= lenArc * 2 + lenStrH + lenStrV) {
    const s = d - lenArc * 2 - lenStrH;
    return { x: sign * W, z: (Z_TOP + R) + s };
  } else if (d <= lenArc * 3 + lenStrH + lenStrV) {
    const a = ((d - lenArc * 2 - lenStrH - lenStrV) / lenArc) * (Math.PI / 2);
    return { x: sign * (W - R * (1 - Math.cos(a))), z: (Z_BOTTOM - R) + R * Math.sin(a) };
  } else if (d <= lenArc * 3 + lenStrH * 2 + lenStrV) {
    const s = d - lenArc * 3 - lenStrH - lenStrV;
    return { x: sign * ((W - R) - s), z: Z_BOTTOM };
  } else {
    const ratio = Math.min(1, Math.max(0, (d - lenArc * 3 - lenStrH * 2 - lenStrV) / lenArc));
    const a = ratio * (Math.PI / 2);
    return { x: sign * (R - R * Math.sin(a)), z: Z_BOTTOM - R * (1 - Math.cos(a)) };
  }
}

// ─── トロッコを傾ける Three.js グループ ────────────────────
function TiltGroup({ tiltRef, cartPosRef, children }) {
  const groupRef = useRef();
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z = -tiltRef.current * (Math.PI / 180);
      groupRef.current.rotation.y = cartPosRef.current.rotY ?? 0;
      groupRef.current.position.x = cartPosRef.current.x;
      groupRef.current.position.z = cartPosRef.current.z;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

// ─── CameraController: トロッコに完全リジッド固定 ────────────────────────
function CameraController({ viewMode, cartPosRef }) {
  const { camera } = useThree();

  useFrame(() => {
    const cx = cartPosRef.current.x;
    const cz = cartPosRef.current.z;
    const rotY = cartPosRef.current.rotY ?? 0;

    if (viewMode === 'normal') {
      // トロッコの進行方向に合わせてオフセットを回転
      const euler = new THREE.Euler(0, rotY, 0, 'YXZ');

      const posOffset = new THREE.Vector3(0, 2.5, 5.5);
      posOffset.applyEuler(euler);

      const lookOffset = new THREE.Vector3(0, 0.5, -5.0);
      lookOffset.applyEuler(euler);

      // 位置・視線・上方向すべてスナップ（lag なし）
      camera.position.set(cx + posOffset.x, TRACK_Y + posOffset.y, cz + posOffset.z);
      camera.up.set(0, 1, 0);
      camera.lookAt(cx + lookOffset.x, TRACK_Y + lookOffset.y, cz + lookOffset.z);

      camera.fov = 50;
    } else {
      camera.position.set(cx, 180.0, cz + 20);
      camera.up.set(0, 0, -1);
      camera.lookAt(cx, TRACK_Y, cz + 5);
      camera.fov = 45;
    }

    camera.updateProjectionMatrix();
  });
  return null;
}

// ─── 線路（突き抜けないように綺麗にトリミングされた中央レール） ───────────
function WideTrack() {
  const startZ = PATH_PARAMS.Z_BOTTOM - PATH_PARAMS.R; 
  const endZ = PATH_PARAMS.Z_TOP + PATH_PARAMS.R;      
  const LEN = startZ - endZ;
  const midZ = (startZ + endZ) / 2;

  const sleeperZs = [];
  for (let z = startZ; z >= endZ; z -= 0.75) sleeperZs.push(z);

  return (
    <group position={[0, TRACK_Y, 0]}>
      <mesh position={[0, -0.68, midZ]}>
        <boxGeometry args={[15, 0.18, Math.abs(LEN)]} />
        <meshStandardMaterial color="#4a5060" roughness={0.85} metalness={0.05} />
      </mesh>
      {sleeperZs.map((z, i) => (
        <mesh key={i} position={[0, -0.50, z]}>
          <boxGeometry args={[13, 0.14, 0.32]} />
          <meshStandardMaterial color="#5c3317" roughness={0.92} />
        </mesh>
      ))}
      <mesh position={[-RAIL_X, -0.42, midZ]}>
        <boxGeometry args={[0.24, 0.05, Math.abs(LEN)]} />
        <meshStandardMaterial color="#6b7280" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[-RAIL_X, -0.30, midZ]}>
        <boxGeometry args={[0.07, 0.22, Math.abs(LEN)]} />
        <meshStandardMaterial color="#8090a0" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[-RAIL_X, -0.19, midZ]}>
        <boxGeometry args={[0.18, 0.07, Math.abs(LEN)]} />
        <meshStandardMaterial color="#c8d4e0" metalness={0.88} roughness={0.12} />
      </mesh>
      <mesh position={[RAIL_X, -0.42, midZ]}>
        <boxGeometry args={[0.24, 0.05, Math.abs(LEN)]} />
        <meshStandardMaterial color="#6b7280" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[RAIL_X, -0.30, midZ]}>
        <boxGeometry args={[0.07, 0.22, Math.abs(LEN)]} />
        <meshStandardMaterial color="#8090a0" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[RAIL_X, -0.19, midZ]}>
        <boxGeometry args={[0.18, 0.07, Math.abs(LEN)]} />
        <meshStandardMaterial color="#c8d4e0" metalness={0.88} roughness={0.12} />
      </mesh>
    </group>
  );
}

// ─── 幅広トロッコ ─────────────────────────────────────────
function WideCart() {
  const W    = CART_W;
  const H    = 1.35;
  const D    = 1.7;
  const base = -0.30;
  const Y    = TRACK_Y;

  return (
    <group position={[0, Y, 0]}>
      <mesh position={[-W / 2, base + H / 2, 0]}>
        <boxGeometry args={[0.18, H, D]} />
        <meshStandardMaterial color="#b45309" metalness={0.25} roughness={0.75} />
      </mesh>
      {[-0.55, 0, 0.55].map((z, i) => (
        <mesh key={i} position={[-W / 2 - 0.03, base + H / 2, z]}>
          <boxGeometry args={[0.08, H + 0.06, 0.12]} />
          <meshStandardMaterial color="#78350f" metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[W / 2, base + H / 2, 0]}>
        <boxGeometry args={[0.18, H, D]} />
        <meshStandardMaterial color="#b45309" metalness={0.25} roughness={0.75} />
      </mesh>
      {[-0.55, 0, 0.55].map((z, i) => (
        <mesh key={i} position={[W / 2 + 0.03, base + H / 2, z]}>
          <boxGeometry args={[0.08, H + 0.06, 0.12]} />
          <meshStandardMaterial color="#78350f" metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, base + H * 0.25, D / 2]}>
        <boxGeometry args={[W + 0.14, H * 0.5, 0.12]} />
        <meshStandardMaterial color="#92400e" metalness={0.4} roughness={0.6} transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, base + H * 0.75, D / 2]}>
        <boxGeometry args={[W + 0.14, H * 0.5, 0.12]} />
        <meshStandardMaterial color="#92400e" metalness={0.4} roughness={0.6} transparent opacity={0.10} />
      </mesh>
      <mesh position={[0, base + H / 2, -D / 2]}>
        <boxGeometry args={[W + 0.14, H, 0.12]} />
        <meshStandardMaterial color="#78350f" metalness={0.35} roughness={0.65} />
      </mesh>
      <mesh position={[0, base, 0]}>
        <boxGeometry args={[W, 0.1, D]} />
        <meshStandardMaterial color="#1a0e04" roughness={1} />
      </mesh>
      {[-W / 2, W / 2].map((x, i) => (
        <mesh key={i} position={[x, base + H + 0.045, 0]}>
          <boxGeometry args={[0.22, 0.09, D + 0.16]} />
          <meshStandardMaterial color="#6b3508" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, base + H + 0.045, D / 2]}>
        <boxGeometry args={[W + 0.26, 0.09, 0.16]} />
        <meshStandardMaterial color="#6b3508" metalness={0.6} roughness={0.4} transparent opacity={0.30} />
      </mesh>
      <mesh position={[0, base + H + 0.045, -D / 2]}>
        <boxGeometry args={[W + 0.26, 0.09, 0.16]} />
        <meshStandardMaterial color="#6b3508" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, base - 0.07, 0]}>
        <boxGeometry args={[W + 0.22, 0.1, D + 0.18]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.4} />
      </mesh>
      {[0.62, -0.62].map((z, i) => (
        <mesh key={i} position={[0, base - 0.2, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, W + 2.4, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.85} />
        </mesh>
      ))}
      {[
        [-W / 2 - 0.8, base - 0.2,  0.62],
        [ W / 2 + 0.8, base - 0.2,  0.62],
        [-W / 2 - 0.8, base - 0.2, -0.62],
        [ W / 2 + 0.8, base - 0.2, -0.62],
      ].map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.13, 14]} />
            <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.23, 0.03, 6, 14]} />
            <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.075, 0.15, 8]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DiagBox({ x1, y, z1, x2, z2, w, h, color, metalness = 0, roughness = 1 }) {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const ang = Math.atan2(dx, dz);
  return (
    <mesh position={[(x1 + x2) / 2, y, (z1 + z2) / 2]} rotation={[0, ang, 0]}>
      <boxGeometry args={[w, h, len]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function DiagRail({ x1, z1, x2, z2, yOffset = 0 }) {
  return (
    <>
      <DiagBox x1={x1} y={TRACK_Y-0.42 + yOffset} z1={z1} x2={x2} z2={z2} w={0.24} h={0.05} color="#6b7280" metalness={0.65} roughness={0.35} />
      <DiagBox x1={x1} y={TRACK_Y-0.30 + yOffset} z1={z1} x2={x2} z2={z2} w={0.07} h={0.22} color="#8090a0" metalness={0.72} roughness={0.28} />
      <DiagBox x1={x1} y={TRACK_Y-0.19 + yOffset} z1={z1} x2={x2} z2={z2} w={0.18} h={0.07} color="#c8d4e0" metalness={0.88} roughness={0.12} />
    </>
  );
}

function TrackSegment({ direction, segments = 250, yOffset = 0 }) {
  const parts = [];
  for (let i = 0; i < segments; i++) {
    const t1 = i / segments;
    const t2 = (i + 1) / segments;
    const c1 = getOuterLoopPoint(direction, t1);
    const c2 = getOuterLoopPoint(direction, t2);

    const dx = c2.x - c1.x;
    const dz = c2.z - c1.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len === 0) continue;
    const nx = dz / len;
    const nz = -dx / len;

    const lx1 = c1.x - nx * RAIL_X, lz1 = c1.z - nz * RAIL_X;
    const lx2 = c2.x - nx * RAIL_X, lz2 = c2.z - nz * RAIL_X;
    const rx1 = c1.x + nx * RAIL_X, rz1 = c1.z + nz * RAIL_X;
    const rx2 = c2.x + nx * RAIL_X, rz2 = c2.z + nz * RAIL_X;

    parts.push(
      <group key={`rail-${i}`}>
        <DiagRail x1={lx1} z1={lz1} x2={lx2} z2={lz2} yOffset={yOffset} />
        <DiagRail x1={rx1} z1={rz1} x2={rx2} z2={rz2} yOffset={yOffset} />
      </group>
    );

    const cmx = (c1.x + c2.x) / 2, cmz = (c1.z + c2.z) / 2;
    const slx1 = cmx - nx * 6.5, slz1 = cmz - nz * 6.5;
    const slx2 = cmx + nx * 6.5, slz2 = cmz + nz * 6.5;

    parts.push(
      <group key={`bed-${i}`}>
        <DiagBox x1={cmx - nx*7.5} y={TRACK_Y-0.68 + yOffset} z1={cmz - nz*7.5} x2={cmx + nx*7.5} z2={cmz + nz*7.5} w={len * 1.05} h={0.18} color="#4a5060" roughness={0.85} metalness={0.05} />
        <DiagBox x1={slx1} y={TRACK_Y-0.50 + yOffset} z1={slz1} x2={slx2} z2={slz2} w={0.32} h={0.14} color="#5c3317" roughness={0.92} />
      </group>
    );
  }
  return <group>{parts}</group>;
}

function SwitchLever({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 0.5, 12]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.8]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 5, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 8]} />
        <meshStandardMaterial color="#a0aec0" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.4, 0.4]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#4a5568" roughness={0.7} />
      </mesh>
    </group>
  );
}

function TrackFork() {
  return (
    <group>
      <TrackSegment direction="left" segments={250} yOffset={0.001} />
      <TrackSegment direction="right" segments={250} yOffset={0.002} />
      <SwitchLever position={[8.5, TRACK_Y - 0.68, PATH_PARAMS.Z_TOP + PATH_PARAMS.R + 2]} />
    </group>
  );
}

// ─── プレイ画面 ──────────────────────────────────────────
export default function DevTrolleyPlayScreen({ pendingBranch, onBranchComplete, onHandRaised, onVotesChange, timeoutLabel, hintText }) {
  const votesRef      = useRef({ left: 0, right: 0 });
  const tiltRef       = useRef(0);
  const videoPanelRef = useRef(null);
  const animRef       = useRef(null);
  const cartPosRef    = useRef({ x: 0, z: PATH_PARAMS.INITIAL_Z, rotY: 0 });
  const branchAnimRef = useRef(null);
  const [votesDisplay, setVotesDisplay] = useState({ left: 0, right: 0 });
  const [viewMode, setViewMode]         = useState('normal');
  const [branching, setBranching]       = useState(false);

  const toggleView = useCallback(() => {
    setViewMode((prev) => (prev === 'normal' ? 'top' : 'normal'));
  }, []);

  const triggerBranch = useCallback((direction) => {
    if (branchAnimRef.current) return;
    setBranching(true);
    branchAnimRef.current = { phase: 'branch', startTime: Date.now(), direction };
  }, []);

  const handleVotes = useCallback((v) => {
    votesRef.current = v;
    setVotesDisplay(v);
    onVotesChange?.(v);
  }, [onVotesChange]);

  // 親コンポーネントから分岐指示を受け取ったらアニメーションを開始する
  useEffect(() => {
    if (pendingBranch && !branchAnimRef.current) {
      triggerBranch(pendingBranch);
    }
  }, [pendingBranch, triggerBranch]);

  useEffect(() => {
    const animate = () => {
      const { left, right } = votesRef.current;
      const total      = left + right;
      const normalized = total > 0 ? (right - left) / total : 0;
      const targetDeg  = normalized * 22;
      tiltRef.current  = lerp(tiltRef.current, targetDeg, 0.05);

      if (branchAnimRef.current) {
        const anim = branchAnimRef.current;
        const elapsed = Date.now() - anim.startTime;

        if (anim.phase === 'branch') {
          const t = Math.min(elapsed / BRANCH_DURATION, 1);
          const pos = getCartPoint(anim.direction, 'branch', t);
          const tan = getCartTangent(anim.direction, 'branch', t);
          cartPosRef.current = { x: pos.x, z: pos.z, rotY: Math.atan2(-tan.x, -tan.z) };
          if (t >= 1) {
            branchAnimRef.current = { phase: 'return-arc', startTime: Date.now(), direction: anim.direction };
          }
        } else if (anim.phase === 'return-arc') {
          const t = Math.min(elapsed / RETURN_ARC_DURATION, 1);
          const pos = getCartPoint(anim.direction, 'return-arc', t);
          const tan = getCartTangent(anim.direction, 'return-arc', t);
          cartPosRef.current = { x: pos.x, z: pos.z, rotY: Math.atan2(-tan.x, -tan.z) };
          if (t >= 1) {
            let startRotY = Math.atan2(-tan.x, -tan.z);
            while (startRotY > Math.PI) startRotY -= 2 * Math.PI;
            while (startRotY <= -Math.PI) startRotY += 2 * Math.PI;
            branchAnimRef.current = { phase: 'return-straight', startTime: Date.now(), startRotY };
          }
        } else if (anim.phase === 'return-straight') {
          const t = Math.min(elapsed / RETURN_STRAIGHT_DURATION, 1);
          const startZ = PATH_PARAMS.Z_BOTTOM - PATH_PARAMS.R;
          const initialZ = PATH_PARAMS.INITIAL_Z;
          const z = startZ - (startZ - initialZ) * t; 
          const rotY = anim.startRotY * (1 - t); 
          cartPosRef.current = { x: 0, z, rotY };
          if (t >= 1) {
            cartPosRef.current = { x: 0, z: initialZ, rotY: 0 };
            branchAnimRef.current = null;
            setBranching(false);
            onBranchComplete?.();
          }
        }
      }

      // ビデオパネルの回転(傾き)同期
      if (videoPanelRef.current) {
        videoPanelRef.current.style.transform =
          `translateX(-50%) rotate(${tiltRef.current.toFixed(3)}deg)`;
      }
      
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const total   = votesDisplay.left + votesDisplay.right;
  const leftPct = total > 0 ? Math.round((votesDisplay.left / total) * 100) : 50;

  return (
    <div style={styles.root}>
      <div style={styles.canvasWrap}>
        <Canvas
          camera={{ position: [0, 2.2, 7.5], fov: 50 }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <CameraController viewMode={viewMode} cartPosRef={cartPosRef} tiltRef={tiltRef} />
          
          <ambientLight intensity={0.85} />
          <directionalLight position={[4, 10, 6]}  intensity={1.6} castShadow />
          <directionalLight position={[0, 6, 2]}   intensity={1.4} color="#fff8f0" />
          <directionalLight position={[-4, 4, -3]} intensity={0.5} color="#7799cc" />
          <pointLight position={[0, 0.5, 1]} intensity={1.2} distance={12} color="#fff5e0" />
          
          <WideTrack />
          <TrackFork />
          <TiltGroup tiltRef={tiltRef} cartPosRef={cartPosRef}>
            <WideCart />
          </TiltGroup>
        </Canvas>
      </div>

      <div ref={videoPanelRef} style={{ ...styles.videoPanel, visibility: viewMode === 'top' ? 'hidden' : 'visible' }}>
        <PoseDetector onVotes={handleVotes} onHandRaised={onHandRaised} hintText={hintText} />
      </div>

      {timeoutLabel && (
        <div style={styles.timeoutOverlay}>
          <span style={styles.timeoutText}>{timeoutLabel}</span>
        </div>
      )}

      <div style={styles.overlay}>
        <div style={styles.voteBadge}>
          <span style={{ ...styles.sideLabel, color: '#60a5fa' }}>⬅ {votesDisplay.left}人</span>
          <div style={styles.barWrap}>
            <div style={{ ...styles.barFill, width: `${leftPct}%`,      background: '#60a5fa' }} />
            <div style={{ ...styles.barFill, width: `${100 - leftPct}%`, background: '#f97316' }} />
          </div>
          <span style={{ ...styles.sideLabel, color: '#f97316' }}>{votesDisplay.right}人 ➡</span>
        </div>
        <button onClick={toggleView} style={styles.viewBtn}>
          {viewMode === 'normal' ? '▲ Top View' : '▼ Normal View'}
        </button>
      </div>
    </div>
  );
}

// ─── スタイル ─────────────────────────────────────────────
const styles = {
  root: {
    position: 'relative',
    height: '100vh',
    background: '#0d0d1a',
    overflow: 'hidden',
  },
  canvasWrap: {
    position: 'absolute',
    inset: 0,
  },
  videoPanel: {
    position: 'absolute',
    bottom: '20%', 
    left: '50%',
    transform: 'translateX(-50%)',
    height: '65%', 
    aspectRatio: '15/9',
    overflow: 'hidden',
    borderRadius: 6,
    zIndex: 10,
  },
  overlay: {
    position: 'absolute',
    top: 12, right: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 100,
  },
  voteBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    padding: '8px 14px',
    minWidth: 220,
    backdropFilter: 'blur(4px)',
  },
  sideLabel: {
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    fontFamily: 'monospace',
  },
  barWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    display: 'flex',
    background: 'rgba(255,255,255,0.15)',
  },
  barFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  timeoutOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    pointerEvents: 'none',
  },
  timeoutText: {
    fontSize: 120,
    fontWeight: 900,
    fontFamily: 'monospace',
    color: '#fbbf24',
    textShadow: '0 0 40px rgba(251,191,36,0.9), 0 4px 24px rgba(0,0,0,0.9)',
    letterSpacing: '-0.05em',
    animation: 'none',
    opacity: 0.92,
  },
  viewBtn: {
    background: 'rgba(0,0,0,0.65)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 12,
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 14px',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    fontFamily: 'monospace',
    letterSpacing: '0.03em',
  },
};