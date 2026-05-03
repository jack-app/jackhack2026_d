import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import PoseDetector from './PoseDetector';
import rengaTexture from '../assets/texture/renga.jpg';
import bakuhatuVideo from '../assets/bakuhatu.mp4';

const lerp = (a, b, t) => a + (b - a) * t;

export const TRACK_Y  = -5.0;
export const RAIL_X   = 5.0;
export const CART_W   = 11.0;

const BRANCH_DURATION          = 3000;
const RETURN_ARC_DURATION      = 5000;
const RETURN_STRAIGHT_DURATION = 2500;

// ─── 完璧な「2つくっついた長方形」を描くための寸法パラメータ ───────────
const PATH_PARAMS = {
  R: 6,               // 角の丸み（半径）
  W: 21,              // ループの横幅（中心から一番外側のレールまで）
  Z_TOP: -50,         // 長方形の一番上のZ座標
  Z_BOTTOM: 0,        // 長方形の一番下のZ座標
  INITIAL_Z: -41      // トロッコの初期位置（分岐 Z=-44 の少し手前）
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

function CameraController({ viewMode, cartPosRef }) {
  const { camera } = useThree();

  useFrame(() => {
    const cx = cartPosRef.current.x;
    const cz = cartPosRef.current.z;
    const rotY = cartPosRef.current.rotY ?? 0;

    if (viewMode === 'normal') {
      const euler = new THREE.Euler(0, rotY, 0, 'YXZ');
      const posOffset = new THREE.Vector3(0, 3.5, 9.5);
      posOffset.applyEuler(euler);
      const lookOffset = new THREE.Vector3(0, 0.5, -5.0);
      lookOffset.applyEuler(euler);

      camera.position.set(cx + posOffset.x, TRACK_Y + posOffset.y, cz + posOffset.z);
      camera.up.set(0, 1, 0);
      camera.lookAt(cx + lookOffset.x, TRACK_Y + lookOffset.y, cz + lookOffset.z);
      camera.fov = 50;
    } else {
      camera.position.set(cx, 130.0, cz + 30);
      camera.up.set(0, 0, -1);
      camera.lookAt(cx, TRACK_Y, cz + 30);
      camera.fov = 45;
    }
    camera.updateProjectionMatrix();
  });
  return null;
}

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
        <meshStandardMaterial color="#0E1A20" roughness={0.80} metalness={0.05} />
      </mesh>
      {sleeperZs.map((z, i) => (
        <mesh key={i} position={[0, -0.50, z]}>
          <boxGeometry args={[13, 0.14, 0.32]} />
          <meshStandardMaterial color="#1A3040" roughness={0.80} />
        </mesh>
      ))}
      <mesh position={[-RAIL_X, -0.42, midZ]}><boxGeometry args={[0.24, 0.05, Math.abs(LEN)]} /><meshStandardMaterial color="#6b7280" metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[-RAIL_X, -0.30, midZ]}><boxGeometry args={[0.07, 0.22, Math.abs(LEN)]} /><meshStandardMaterial color="#8090a0" metalness={0.72} roughness={0.28} /></mesh>
      <mesh position={[-RAIL_X, -0.19, midZ]}><boxGeometry args={[0.18, 0.07, Math.abs(LEN)]} /><meshStandardMaterial color="#c8d4e0" metalness={0.88} roughness={0.12} /></mesh>
      <mesh position={[RAIL_X, -0.42, midZ]}><boxGeometry args={[0.24, 0.05, Math.abs(LEN)]} /><meshStandardMaterial color="#6b7280" metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[RAIL_X, -0.30, midZ]}><boxGeometry args={[0.07, 0.22, Math.abs(LEN)]} /><meshStandardMaterial color="#8090a0" metalness={0.72} roughness={0.28} /></mesh>
      <mesh position={[RAIL_X, -0.19, midZ]}><boxGeometry args={[0.18, 0.07, Math.abs(LEN)]} /><meshStandardMaterial color="#c8d4e0" metalness={0.88} roughness={0.12} /></mesh>
    </group>
  );
}

function WideCart() {
  const W = CART_W, H = 1.35, D = 1.7, base = -0.30, Y = TRACK_Y;
  return (
    <group position={[0, Y, 0]}>
      {/* 左右のメインパネル（#5DCAA5を少し落ち着かせた色） */}
      <mesh position={[-W / 2, base + H / 2, 0]}><boxGeometry args={[0.18, H, D]} /><meshStandardMaterial color="#4A9C82" metalness={0.25} roughness={0.70} /></mesh>
      {[-0.55, 0, 0.55].map((z, i) => <mesh key={`l-${i}`} position={[-W / 2 - 0.03, base + H / 2, z]}><boxGeometry args={[0.08, H + 0.06, 0.12]} /><meshStandardMaterial color="#1A3040" metalness={0.5} /></mesh>)}
      
      <mesh position={[W / 2, base + H / 2, 0]}><boxGeometry args={[0.18, H, D]} /><meshStandardMaterial color="#4A9C82" metalness={0.25} roughness={0.70} /></mesh>
      {[-0.55, 0, 0.55].map((z, i) => <mesh key={`r-${i}`} position={[W / 2 + 0.03, base + H / 2, z]}><boxGeometry args={[0.08, H + 0.06, 0.12]} /><meshStandardMaterial color="#1A3040" metalness={0.5} /></mesh>)}
      
      {/* 前面のシールド（#5DCAA5の半透明） */}
      <mesh position={[0, base + H * 0.25, D / 2]}><boxGeometry args={[W + 0.14, H * 0.5, 0.12]} /><meshStandardMaterial color="#5DCAA5" metalness={0.4} roughness={0.6} transparent opacity={0.18} /></mesh>
      <mesh position={[0, base + H * 0.75, D / 2]}><boxGeometry args={[W + 0.14, H * 0.5, 0.12]} /><meshStandardMaterial color="#5DCAA5" metalness={0.4} roughness={0.6} transparent opacity={0.10} /></mesh>
      
      {/* 背面のパネル（深緑） */}
      <mesh position={[0, base + H / 2, -D / 2]}><boxGeometry args={[W + 0.14, H, 0.12]} /><meshStandardMaterial color="#1A3040" metalness={0.35} roughness={0.65} /></mesh>
      
      {/* 床面（ダークブルー系） */}
      <mesh position={[0, base, 0]}><boxGeometry args={[W, 0.1, D]} /><meshStandardMaterial color="#0f172a" roughness={1} /></mesh>
      
      {/* 上部のフチ（少し暗めのエメラルド） */}
      {[-W / 2, W / 2].map((x, i) => <mesh key={i} position={[x, base + H + 0.045, 0]}><boxGeometry args={[0.22, 0.09, D + 0.16]} /><meshStandardMaterial color="#2B5A4B" metalness={0.6} roughness={0.4} /></mesh>)}
      <mesh position={[0, base + H + 0.045, D / 2]}><boxGeometry args={[W + 0.26, 0.09, 0.16]} /><meshStandardMaterial color="#2B5A4B" metalness={0.6} roughness={0.4} transparent opacity={0.30} /></mesh>
      <mesh position={[0, base + H + 0.045, -D / 2]}><boxGeometry args={[W + 0.26, 0.09, 0.16]} /><meshStandardMaterial color="#2B5A4B" metalness={0.6} roughness={0.4} /></mesh>
      
      {/* 下部のシャーシ・車輪（暗めのブルーグレー） */}
      <mesh position={[0, base - 0.07, 0]}><boxGeometry args={[W + 0.22, 0.1, D + 0.18]} /><meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} /></mesh>
      {[0.62, -0.62].map((z, i) => <mesh key={i} position={[0, base - 0.2, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, W + 2.4, 8]} /><meshStandardMaterial color="#0f172a" metalness={0.85} /></mesh>)}
      
      {[[-W / 2 - 0.8, base - 0.2, 0.62], [ W / 2 + 0.8, base - 0.2, 0.62], [-W / 2 - 0.8, base - 0.2, -0.62], [ W / 2 + 0.8, base - 0.2, -0.62]].map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.25, 0.25, 0.13, 14]} /><meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} /></mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.23, 0.03, 6, 14]} /><meshStandardMaterial color="#020617" metalness={0.3} roughness={0.8} /></mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.075, 0.075, 0.15, 8]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} /></mesh>
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
        <DiagBox x1={cmx - nx*7.5} y={TRACK_Y-0.68 + yOffset} z1={cmz - nz*7.5} x2={cmx + nx*7.5} z2={cmz + nz*7.5} w={len * 1.05} h={0.18} color="#0E1A20" roughness={0.85} metalness={0.05} />
        <DiagBox x1={slx1} y={TRACK_Y-0.50 + yOffset} z1={slz1} x2={slx2} z2={slz2} w={0.32} h={0.14} color="#1A3040" roughness={0.92} />
      </group>
    );
  }
  return <group>{parts}</group>;
}

function SwitchLever({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.5, 0.7, 0.5, 12]} /><meshStandardMaterial color="#2d3748" roughness={0.8} /></mesh>
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.2, 0.1, 0.8]} /><meshStandardMaterial color="#1a202c" /></mesh>
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 5, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 1.4, 8]} /><meshStandardMaterial color="#a0aec0" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, 1.4, 0.4]} rotation={[0, 0, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#4a5568" roughness={0.7} /></mesh>
    </group>
  );
}

function TrackFork() {
  return (
    <group>
      <TrackSegment direction="left" segments={250} yOffset={0.001} />
      <TrackSegment direction="right" segments={250} yOffset={0.002} />
      <SwitchLever position={[4.25, TRACK_Y - 0.68, PATH_PARAMS.Z_TOP + PATH_PARAMS.R + 1]} />
    </group>
  );
}

// ─── 追加：レンガ壁のパーツ群 ──────────────────────────────
const WallPart = ({ cx, cz, len, thickness, height, ang, tex, uOffset = 0 }) => {
  const mat = useMemo(() => {
    if (!tex) return null;
    const m = new THREE.MeshStandardMaterial({ map: tex.clone(), color: '#ffffff', roughness: 0.8 });
    m.map.repeat.set(len / 5, 4); 
    m.map.offset.set(uOffset, 0); 
    m.map.wrapS = THREE.RepeatWrapping;
    m.map.wrapT = THREE.RepeatWrapping;
    if (THREE.SRGBColorSpace) m.map.colorSpace = THREE.SRGBColorSpace;
    m.map.needsUpdate = true;
    return m;
  }, [tex, len, uOffset]);

  if (!mat) {
    return (
      <mesh position={[cx, TRACK_Y + height/2, cz]} rotation={[0, ang, 0]}>
        <boxGeometry args={[thickness, height, len]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    );
  }

  return (
    <mesh position={[cx, TRACK_Y + height/2, cz]} rotation={[0, ang, 0]} material={mat}>
      <boxGeometry args={[thickness, height, len]} />
    </mesh>
  );
};

const CornerWall = ({ cx, cz, r, startAngle, endAngle, tex, height, thickness }) => {
  const segments = 12;
  const parts = [];
  const angleStep = (endAngle - startAngle) / segments;
  let currentUOffset = 0;
  
  for(let i=0; i<segments; i++) {
    const a1 = startAngle + i * angleStep;
    const a2 = startAngle + (i + 1) * angleStep;
    const p1x = cx + r * Math.cos(a1);
    const p1z = cz + r * Math.sin(a1);
    const p2x = cx + r * Math.cos(a2);
    const p2z = cz + r * Math.sin(a2);
    const midX = (p1x + p2x) / 2;
    const midZ = (p1z + p2z) / 2;
    const dx = p2x - p1x;
    const dz = p2z - p1z;
    const len = Math.sqrt(dx*dx + dz*dz);
    const ang = Math.atan2(dx, dz);
    
    parts.push(
      <WallPart key={i} cx={midX} cz={midZ} len={len + 0.1} thickness={thickness} height={height} ang={ang} tex={tex} uOffset={currentUOffset} />
    );
    currentUOffset += len / 5;
  }
  return <group>{parts}</group>;
};

function BrickWalls() {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      rengaTexture,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else tex.encoding = 3001; 
        setTexture(tex);
      },
      undefined,
      (err) => console.error("レンガ画像の読み込みエラー:", err)
    );
  }, []);

  const matIsland = useMemo(() => {
    if (!texture) return null;
    const m = new THREE.MeshStandardMaterial({ map: texture.clone(), color: '#ffffff', roughness: 0.8 });
    m.map.repeat.set(6, 4);
    m.map.needsUpdate = true;
    return m;
  }, [texture]);

  // 天井用のマテリアル（空間全体を覆うためリピート数を増やす）
  const matCeiling = useMemo(() => {
    if (!texture) return null;
    const m = new THREE.MeshStandardMaterial({ map: texture.clone(), color: '#ffffff', roughness: 0.8 });
    m.map.repeat.set(12, 14); 
    m.map.needsUpdate = true;
    return m;
  }, [texture]);

  const H = 13.5; 
  const Y = TRACK_Y + H / 2;

  if (!matIsland || !matCeiling) {
    return (
      <group>
        {/* ローディング中のダミー */}
        <mesh position={[0, TRACK_Y + H + 0.5, -25]}><boxGeometry args={[64, 1, 72]} /><meshStandardMaterial color="#888888" /></mesh>
        <mesh position={[-10.5, Y, -25]}><boxGeometry args={[10, H, 38]} /><meshStandardMaterial color="#888888" /></mesh>
        <mesh position={[10.5, Y, -25]}><boxGeometry args={[10, H, 38]} /><meshStandardMaterial color="#888888" /></mesh>
      </group>
    );
  }

  return (
    <group>
      {/* 天井部分（全体を覆う巨大な板） */}
      <mesh position={[0, TRACK_Y + H + 0.5, -25]} material={matCeiling}>
        <boxGeometry args={[64, 1, 72]} />
      </mesh>

      <mesh position={[-10.5, Y, -25]} material={matIsland}><boxGeometry args={[10, H, 38]} /></mesh>
      <mesh position={[10.5, Y, -25]} material={matIsland}><boxGeometry args={[10, H, 38]} /></mesh>

      <WallPart cx={0} cz={-58.5} len={30} thickness={2} height={H} ang={Math.PI/2} tex={texture} />
      <WallPart cx={0} cz={8.5} len={30} thickness={2} height={H} ang={Math.PI/2} tex={texture} />
      <WallPart cx={-29.5} cz={-25} len={38} thickness={2} height={H} ang={0} tex={texture} />
      <WallPart cx={29.5} cz={-25} len={38} thickness={2} height={H} ang={0} tex={texture} />

      <CornerWall cx={-15} cz={-44} r={14.5} startAngle={Math.PI} endAngle={3*Math.PI/2} tex={texture} height={H} thickness={2} />
      <CornerWall cx={15} cz={-44} r={14.5} startAngle={3*Math.PI/2} endAngle={2*Math.PI} tex={texture} height={H} thickness={2} />
      <CornerWall cx={-15} cz={-6} r={14.5} startAngle={Math.PI/2} endAngle={Math.PI} tex={texture} height={H} thickness={2} />
      <CornerWall cx={15} cz={-6} r={14.5} startAngle={0} endAngle={Math.PI/2} tex={texture} height={H} thickness={2} />
    </group>
  );
}

// ─── 追加：坑道の木組み（柱とXブレース）を描画するコンポーネント ────────
const TimberPanel = ({ p1, p2, height, mat }) => {
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const L = Math.sqrt(dx*dx + dz*dz);
  if (L === 0) return null;

  const ang = Math.atan2(dx, dz);
  const cx = (p1.x + p2.x) / 2;
  const cz = (p1.z + p2.z) / 2;

  // 壁の法線方向（内側）を計算
  let nx = p1.nx + p2.nx;
  let nz = p1.nz + p2.nz;
  const nlen = Math.sqrt(nx*nx + nz*nz);
  if (nlen > 0) { nx /= nlen; nz /= nlen; }
  else { nx = p1.nx; nz = p1.nz; }

  // 壁から少しだけ浮かせてめり込みを防ぐ
  const inset = 0.3;
  const gx = cx + nx * inset;
  const gz = cz + nz * inset;

  const thick = 0.5;
  const braceLen = Math.sqrt(L*L + height*height);
  const braceAng = Math.atan2(L, height);

  // 天井を支える張り出し梁（トンネル中央に向かって伸びる梁）
  const overhang = 3.5;
  const slantLen = Math.sqrt(overhang*overhang + overhang*overhang);

  return (
    <group position={[gx, TRACK_Y, gz]} rotation={[0, ang, 0]}>
      {/* 左右の柱 */}
      <mesh position={[0, height/2, -L/2]} material={mat}><boxGeometry args={[thick, height, thick]} /></mesh>
      <mesh position={[0, height/2, L/2]} material={mat}><boxGeometry args={[thick, height, thick]} /></mesh>

      {/* 上・下・中段の梁 */}
      <mesh position={[0, height - thick/2, 0]} material={mat}><boxGeometry args={[thick, thick, L]} /></mesh>
      <mesh position={[0, height * 0.4, 0]} material={mat}><boxGeometry args={[thick, thick, L]} /></mesh>
      <mesh position={[0, thick/2, 0]} material={mat}><boxGeometry args={[thick, thick, L]} /></mesh>

      {/* Xブレース */}
      <mesh position={[0, height/2, 0]} rotation={[braceAng, 0, 0]} material={mat}><boxGeometry args={[thick*0.8, braceLen, thick*0.8]} /></mesh>
      <mesh position={[0, height/2, 0]} rotation={[-braceAng, 0, 0]} material={mat}><boxGeometry args={[thick*0.8, braceLen, thick*0.8]} /></mesh>

      {/* 天井を支える梁（内側へ張り出す） */}
      <mesh position={[overhang/2, height - thick/2, -L/2]} material={mat}><boxGeometry args={[overhang, thick, thick]} /></mesh>
      <mesh position={[overhang/2, height - thick/2, L/2]} material={mat}><boxGeometry args={[overhang, thick, thick]} /></mesh>

      {/* 張り出し梁の斜め支柱（ブラケット補強） */}
      <mesh position={[overhang/2 - 0.2, height - overhang/2 - 0.2, -L/2]} rotation={[0, 0, Math.PI/4]} material={mat}><boxGeometry args={[thick*0.8, slantLen, thick*0.8]} /></mesh>
      <mesh position={[overhang/2 - 0.2, height - overhang/2 - 0.2, L/2]} rotation={[0, 0, Math.PI/4]} material={mat}><boxGeometry args={[thick*0.8, slantLen, thick*0.8]} /></mesh>
    </group>
  );
};

// 経路から一定間隔でポイントを生成する関数
const buildPath = (def, interval) => {
  let pts = [];
  for (const seg of def) {
    if (seg.type === 'straight') {
      const dx = seg.x2 - seg.x1;
      const dz = seg.z2 - seg.z1;
      const len = Math.sqrt(dx*dx + dz*dz);
      const steps = Math.ceil(len / interval);
      for (let i = 0; i < steps; i++) {
        pts.push({ x: seg.x1 + (dx*i)/steps, z: seg.z1 + (dz*i)/steps, nx: seg.nx, nz: seg.nz });
      }
    } else if (seg.type === 'arc') {
      const range = seg.a2 - seg.a1;
      const len = Math.abs(range) * seg.r;
      const steps = Math.ceil(len / interval);
      for (let i = 0; i < steps; i++) {
        const a = seg.a1 + (range*i)/steps;
        pts.push({ x: seg.cx + seg.r * Math.cos(a), z: seg.cz + seg.r * Math.sin(a), nx: -Math.cos(a), nz: -Math.sin(a) });
      }
    }
  }
  const last = def[def.length - 1];
  if (last.type === 'straight') {
    pts.push({ x: last.x2, z: last.z2, nx: last.nx, nz: last.nz });
  } else {
    const a = last.a2;
    pts.push({ x: last.cx + last.r * Math.cos(a), z: last.cz + last.r * Math.sin(a), nx: -Math.cos(a), nz: -Math.sin(a) });
  }
  return pts;
};

function TimberFrames() {
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1A3040", roughness: 0.95, metalness: 0.05 }), []);
  const H = 13.5;
  const interval = 4.5; // Xブレースの間隔

  // 坑道を一周する壁の座標定義
  const outerLeftDef = [
    { type: 'straight', x1: 0, z1: -57.5, x2: -15, z2: -57.5, nx: 0, nz: 1 },
    { type: 'arc', cx: -15, cz: -44, r: 13.5, a1: -Math.PI/2, a2: -Math.PI }, 
    { type: 'straight', x1: -28.5, z1: -44, x2: -28.5, z2: -6, nx: 1, nz: 0 },
    { type: 'arc', cx: -15, cz: -6, r: 13.5, a1: Math.PI, a2: Math.PI/2 }, 
    { type: 'straight', x1: -15, z1: 7.5, x2: 0, z2: 7.5, nx: 0, nz: -1 }
  ];

  const outerRightDef = [
    { type: 'straight', x1: 0, z1: -57.5, x2: 15, z2: -57.5, nx: 0, nz: 1 },
    { type: 'arc', cx: 15, cz: -44, r: 13.5, a1: -Math.PI/2, a2: 0 },
    { type: 'straight', x1: 28.5, z1: -44, x2: 28.5, z2: -6, nx: -1, nz: 0 },
    { type: 'arc', cx: 15, cz: -6, r: 13.5, a1: 0, a2: Math.PI/2 },
    { type: 'straight', x1: 15, z1: 7.5, x2: 0, z2: 7.5, nx: 0, nz: -1 }
  ];

  const leftIslandDef = [
    { type: 'straight', x1: -5.5, z1: -6, x2: -5.5, z2: -44, nx: 1, nz: 0 },
    { type: 'straight', x1: -5.5, z1: -44, x2: -15.5, z2: -44, nx: 0, nz: 1 },
    { type: 'straight', x1: -15.5, z1: -44, x2: -15.5, z2: -6, nx: -1, nz: 0 },
    { type: 'straight', x1: -15.5, z1: -6, x2: -5.5, z2: -6, nx: 0, nz: -1 }
  ];

  const rightIslandDef = [
    { type: 'straight', x1: 5.5, z1: -44, x2: 5.5, z2: -6, nx: -1, nz: 0 },
    { type: 'straight', x1: 5.5, z1: -6, x2: 15.5, z2: -6, nx: 0, nz: -1 },
    { type: 'straight', x1: 15.5, z1: -6, x2: 15.5, z2: -44, nx: 1, nz: 0 },
    { type: 'straight', x1: 15.5, z1: -44, x2: 5.5, z2: -44, nx: 0, nz: 1 }
  ];

  const defs = [outerLeftDef, outerRightDef, leftIslandDef, rightIslandDef];

  const renderPanels = (def) => {
    const pts = buildPath(def, interval);
    const panels = [];
    for (let i = 0; i < pts.length - 1; i++) {
      panels.push(<TimberPanel key={i} p1={pts[i]} p2={pts[i+1]} height={H} mat={woodMat} />);
    }
    return panels;
  };

  return (
    <group>
      {defs.map((def, idx) => <group key={idx}>{renderPanels(def)}</group>)}
    </group>
  );
}

// ─── プレイ画面 ──────────────────────────────────────────
export default function DevTrolleyPlayScreen({ pendingBranch, onBranchComplete, onHandRaised, onVotesChange, hintText, correctBranch, batteryDead, onBatteryDeadComplete }) {
  const votesRef           = useRef({ left: 0, right: 0 });
  const tiltRef            = useRef(0);
  const videoPanelRef      = useRef(null);
  const explosionVideoRef   = useRef(null);
  const animRef            = useRef(null);
  const cartPosRef         = useRef({ x: 0, z: PATH_PARAMS.INITIAL_Z, rotY: 0 });
  const branchAnimRef      = useRef(null);
  const onBranchCompleteRef = useRef(onBranchComplete);
  const [votesDisplay, setVotesDisplay] = useState({ left: 0, right: 0 });
  const [viewMode, setViewMode]         = useState('normal');
  const [branching, setBranching]       = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const resultVisibleRef = useRef(false);
  const isCorrectRef = useRef(null);
  const [batteryDeadExplosion, setBatteryDeadExplosion] = useState(false);

  useEffect(() => {
    isCorrectRef.current = pendingBranch != null && correctBranch != null ? pendingBranch === correctBranch : null;
  }, [pendingBranch, correctBranch]);

  // battery が 0 以下になったら即座に爆発させて /finish へ遷移する（テキストなし）
  useEffect(() => {
    if (!batteryDead) return;
    branchAnimRef.current = null;
    setBranching(false);
    isCorrectRef.current = false;
    setBatteryDeadExplosion(true);
    resultVisibleRef.current = true;
    setResultVisible(true);
    const timer = setTimeout(() => {
      onBatteryDeadComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [batteryDead]);

  useEffect(() => {
    const videoElem = explosionVideoRef.current;
    if (!videoElem) return;

    if (resultVisible && isCorrectRef.current === false) {
      // 不正解のときだけ表示して再生
      videoElem.style.display = 'block';
      videoElem.play().catch(err => console.error("爆発ビデオ再生エラー:", err));
    } else {
      // それ以外（正解、または結果非表示中）は隠して停止、頭に戻す
      videoElem.style.display = 'none';
      videoElem.pause();
      videoElem.currentTime = 0;
    }
  }, [resultVisible]);

  const toggleView = useCallback(() => setViewMode((prev) => (prev === 'normal' ? 'top' : 'normal')), []);

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

  useEffect(() => { onBranchCompleteRef.current = onBranchComplete; }, [onBranchComplete]);

  useEffect(() => {
    if (pendingBranch && !branchAnimRef.current) {
      triggerBranch(pendingBranch);
    }
  }, [pendingBranch, triggerBranch]);

  useEffect(() => {
    let isMounted = true;
    const animate = () => {
      if (!isMounted) return;
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
          
          if (t >= 1 && !resultVisibleRef.current) {
            resultVisibleRef.current = true;
            setResultVisible(true);

            // 【変更】正解・不正解にかかわらずアニメーションを続行する（スキップしない）
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
            
            // 【変更】ここではまだ「不正解/正解」を消さない（表示を維持する）
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
            
            // 【変更】return-straight のアニメーションが完了したタイミングで結果を消し、遷移させる
            resultVisibleRef.current = false;
            setResultVisible(false);
            onBranchCompleteRef.current?.();
          }
        }
      }

      if (videoPanelRef.current) {
        videoPanelRef.current.style.transform = `translateX(-50%) rotate(${tiltRef.current.toFixed(3)}deg)`;
      }
      
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      isMounted = false; 
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const total   = votesDisplay.left + votesDisplay.right;
  const leftPct = total > 0 ? Math.round((votesDisplay.left / total) * 100) : 50;

  const isCorrect   = pendingBranch != null && correctBranch != null ? pendingBranch === correctBranch : null;
  const resultText  = isCorrect ? '正解' : '不正解';
  const resultColor = isCorrect ? '#5DCAA5' : '#E23636';

  return (
    <div style={styles.root}>
      <div style={styles.canvasWrap}>
        <Canvas
          camera={{ position: [0, 2.2, 7.5], fov: 50 }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <CameraController viewMode={viewMode} cartPosRef={cartPosRef} tiltRef={tiltRef} />
          
          <ambientLight intensity={1.5} color="#ffffff" />
          <directionalLight position={[4, 10, 6]}  intensity={2.5} color="#ffffff" castShadow />
          <directionalLight position={[0, 6, 2]}   intensity={2.0} color="#ffffff" />
          <directionalLight position={[-4, 4, -3]} intensity={1.2} color="#ffffff" />
          <pointLight position={[0, 0.5, 1]} intensity={3.0} distance={20} color="#ffffff" />
          
          <BrickWalls /> 
          <TimberFrames />
          
          <WideTrack />
          <TrackFork />
          <TiltGroup tiltRef={tiltRef} cartPosRef={cartPosRef}>
            <WideCart />
          </TiltGroup>
        </Canvas>
      </div>

      <div ref={videoPanelRef} style={{ ...styles.videoPanel, visibility: viewMode === 'top' ? 'hidden' : 'visible' }}>
        <PoseDetector onVotes={handleVotes} onHandRaised={onHandRaised} hintText={hintText} disableHint={pendingBranch != null}/>
        <video
          ref={explosionVideoRef}
          src={bakuhatuVideo}
          style={styles.explosionVideo}
          muted
          playsInline
          loop
        />
        {/* 投票中（トロッコ未発車）のみ現在の多数決方向を表示 */}
        {pendingBranch === null && total > 0 && (() => {
          const goLeft = votesDisplay.left >= votesDisplay.right;
          const tied   = votesDisplay.left === votesDisplay.right;
          const label  = tied ? '← →' : goLeft ? '←' : '→';
          const color  = tied ? '#fbbf24' : goLeft ? '#5DCAA5' : '#E23636';
          return (
            <div style={styles.voteDirectionOverlay}>
              <span style={{ ...styles.voteDirectionText, color }}>{label}</span>
            </div>
          );
        })()}
      </div>

      {resultVisible && !batteryDeadExplosion && (
        <div style={styles.resultOverlay}>
          <span style={{ ...styles.resultText, color: resultColor }}>{resultText}</span>
        </div>
      )}

      <div style={styles.overlay}>
        <div style={styles.voteBadge}>
          <span style={{ ...styles.sideLabel, color: '#5DCAA5' }}>⬅ {votesDisplay.left}人</span>
          <div style={styles.barWrap}>
            <div style={{ ...styles.barFill, width: `${leftPct}%`,      background: '#5DCAA5' }} />
            <div style={{ ...styles.barFill, width: `${100 - leftPct}%`, background: '#E23636' }} />
          </div>
          <span style={{ ...styles.sideLabel, color: '#E23636' }}>{votesDisplay.right}人 ➡</span>
        </div>
        {/* <button onClick={toggleView} style={styles.viewBtn}>
          {viewMode === 'normal' ? '▲ Top View' : '▼ Normal View'}
        </button> */}
      </div>
    </div>
  );
}

const styles = {
  root: { position: 'relative', height: '100vh', background: '#0d0d1a', overflow: 'hidden' },
  canvasWrap: { position: 'absolute', inset: 0 },
  videoPanel: { position: 'absolute', bottom: '40%', left: '50%', transform: 'translateX(-50%)', height: '55%', aspectRatio: '15/9', overflow: 'hidden', borderRadius: 6, zIndex: 10 },
  explosionVideo: {
    position: 'absolute',
    inset: 0, // 親（videoPanel）いっぱいに広げる
    width: '100%',
    height: '100%',
    objectFit: 'cover', // 画面に合わせてトリミング
    zIndex: 20, // PoseDetectorより上に表示
    display: 'none', // 初期は非表示
    pointerEvents: 'none', // ビデオへのクリック等を無効化
    mixBlendMode: 'screen',
  },
  overlay: { position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 100 },
  voteBadge: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '8px 14px', minWidth: 220, backdropFilter: 'blur(4px)' },
  sideLabel: { fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'monospace' },
  barWrap: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.15)' },
  barFill: { height: '100%', transition: 'width 0.3s ease' },
  resultOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, pointerEvents: 'none' },
  resultText: { fontSize: 96, fontWeight: 900, fontFamily: 'monospace', textShadow: '0 0 40px rgba(0,0,0,0.8), 0 4px 24px rgba(0,0,0,0.9)', letterSpacing: '-0.03em', opacity: 0.95 },
  viewBtn: { background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, color: '#e2e8f0', fontSize: 12, fontWeight: 700, padding: '7px 14px', cursor: 'pointer', backdropFilter: 'blur(4px)', fontFamily: 'monospace', letterSpacing: '0.03em' },
  voteDirectionOverlay: { position: 'absolute', top: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 30 },
  voteDirectionText: { fontSize: 52, fontWeight: 900, fontFamily: 'monospace', textShadow: '0 0 20px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.8)', letterSpacing: '0.05em' },
};