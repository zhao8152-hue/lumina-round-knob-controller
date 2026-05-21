import React, { useState, useCallback, useRef } from 'react';

interface RadialDragOptions {
  onRotate?: (deltaAngle: number) => void;
}

/**
 * 旋钮拖拽 Hook
 *
 * 核心算法：鼠标位移的切向投影。
 * 每帧计算鼠标从上一帧到当前帧的位移向量，投影到当前位置的切向方向上。
 *
 * 优势：
 * - 径向移动（朝向/远离圆心）→ 投影为0，不影响数值 ← 不改抖动
 * - 切向移动（绕圆）→ 直接驱动旋转 ← 越转越跟手
 * - 没有 atan2 换向跳变问题 ← 无需 wrap-around 处理
 * - 鼠标走直线也有切向分量 → 横平竖直都流畅
 */
export function useRadialRotation(options: RadialDragOptions = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);

  // 所有拖拽状态存在 ref 里，保证事件处理始终读到最新值
  const dragState = useRef({
    isDragging: false,
    centerX: 0,
    centerY: 0,
    lastX: 0,
    lastY: 0,
  });

  const handlePointerDown = useCallback((e: React.PointerEvent, centerX: number, centerY: number) => {
    dragState.current = {
      isDragging: true,
      centerX,
      centerY,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    setIsDragging(true);
    hasDragged.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;

    // 鼠标到圆心的向量（径向）
    const rx = e.clientX - ds.centerX;
    const ry = e.clientY - ds.centerY;
    const radius = Math.sqrt(rx * rx + ry * ry);

    // 防止除以0；远离圆心时角度精度更高
    if (radius < 1) {
      ds.lastX = e.clientX;
      ds.lastY = e.clientY;
      return;
    }

    // 切向单位向量（逆时针方向）
    // 推导：径向单位向量 u_r = (rx/radius, ry/radius)
    // 逆时针切向单位向量 u_t = (-u_r.y, u_r.x) = (-ry/radius, rx/radius)
    const tx = -ry / radius;
    const ty =  rx / radius;

    // 鼠标位移向量
    const mx = e.clientX - ds.lastX;
    const my = e.clientY - ds.lastY;

    // 位移投影到切向上（点积）
    const tangential = mx * tx + my * ty;

    // 弧长 → 角度（弧度），再转成度
    // 弧长 = tangential（已投影到切向）, 弧度 = 弧长 / 半径
    // 度 = 弧度 × 180/π
    const deltaDeg = (tangential / radius) * (180 / Math.PI);

    // 很小的阈值防止噪声触发，但比之前低很多 (0.1° vs 0.5°)
    if (Math.abs(deltaDeg) > 0.1) {
      hasDragged.current = true;
      options.onRotate?.(deltaDeg);
    }

    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
  }, [options]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragState.current.isDragging = false;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return {
    isDragging,
    hasDragged,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
