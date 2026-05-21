/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { SmartKnob } from './components/SmartKnob';
import { ControllerMode, ControllerState, MODES, getModeBounds } from './types';
import { useRadialRotation } from './hooks/useRadialRotation';

export default function App() {
  const [state, setState] = useState<ControllerState>({
    mode: 'table',
    tableHeight: 75,
    acTemp: 24,
    acFan: 2,
    acMode: 'auto',
    acSwing: false,
    acPower: true,
    lightBrightness: 80,
    curtainPosition: 100,
  });

  const [knobRotation, setKnobRotation] = useState(0);
  const [showSubMenu, setShowSubMenu] = useState(false);

  // PRESETS 视图 5s 无操作自动返回 HOME
  const presetsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPresetsTimer = useCallback(() => {
    if (presetsTimerRef.current) clearTimeout(presetsTimerRef.current);
    presetsTimerRef.current = setTimeout(() => {
      setShowSubMenu(false);
    }, 5000);
  }, []);

  const clearPresetsTimer = useCallback(() => {
    if (presetsTimerRef.current) {
      clearTimeout(presetsTimerRef.current);
      presetsTimerRef.current = null;
    }
  }, []);

  // 进入 PRESETS 时启动定时器，离开时清除；在 PRESETS 中旋转或按钮交互时重置定时器
  useEffect(() => {
    if (showSubMenu) {
      startPresetsTimer();
    } else {
      clearPresetsTimer();
    }
  }, [showSubMenu, knobRotation, state, startPresetsTimer, clearPresetsTimer]);

  // 跨帧累加器：累积角度增量，超过 step 阈值才提交到 state
  const deltaAccumulator = useRef(0);
  const lastMode = useRef<ControllerMode>('table');

  const handleRotationChange = useCallback((delta: number) => {
    setKnobRotation(prev => prev + delta);

    setState(prev => {
      if (prev.mode !== lastMode.current) {
        deltaAccumulator.current = 0;
        lastMode.current = prev.mode;
      }

      const bounds = getModeBounds(prev.mode);
      const unitPerDegree = (bounds.max - bounds.min) / 270;

      deltaAccumulator.current += delta;
      const accumulatedValueDelta = deltaAccumulator.current * unitPerDegree;

      if (Math.abs(accumulatedValueDelta) < bounds.step) {
        return prev;
      }

      const steps = Math.round(accumulatedValueDelta / bounds.step);
      const appliedValueDelta = steps * bounds.step;
      deltaAccumulator.current -= appliedValueDelta / unitPerDegree;

      let currentVal = 0;
      switch (prev.mode) {
        case 'table': currentVal = prev.tableHeight; break;
        case 'ac': currentVal = prev.acTemp; break;
        case 'light': currentVal = prev.lightBrightness; break;
        case 'curtain': currentVal = prev.curtainPosition; break;
      }

      let newVal = currentVal + appliedValueDelta;
      newVal = Math.min(bounds.max, Math.max(bounds.min, newVal));

      if (bounds.step < 1) {
        const inv = 1 / bounds.step;
        newVal = Math.round(newVal * inv) / inv;
      } else {
        newVal = Math.round(newVal / bounds.step) * bounds.step;
      }

      const newState = { ...prev };
      switch (prev.mode) {
        case 'table': newState.tableHeight = newVal; break;
        case 'ac': newState.acTemp = newVal; break;
        case 'light': newState.lightBrightness = newVal; break;
        case 'curtain': newState.curtainPosition = newVal; break;
      }
      return newState;
    });
  }, []);

  const { isDragging, hasDragged, handlePointerDown, handlePointerMove, handlePointerUp } = useRadialRotation({
    onRotate: handleRotationChange
  });

  const [center, setCenter] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCenter = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };

    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, []);

  // 外层 casing 的 tap 检测：非拖拽时切换 PRESETS
  // 模式按钮的 onPointerDown 有 stopPropagation，不会触发 setPointerCapture，
  // 所以点模式按钮时 click 正常发到按钮上，不会走到这里
  const handleCasingClick = () => {
    if (!hasDragged.current) {
      setShowSubMenu(prev => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
      <div 
        ref={containerRef}
        onPointerDown={(e) => handlePointerDown(e, center.x, center.y)}
        onPointerMove={(e) => handlePointerMove(e)}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleCasingClick}
        className="knob-hardware relative flex items-center justify-center bg-white rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.1),_inset_0_2px_4px_rgba(255,255,255,1)] cursor-grab active:cursor-grabbing touch-none"
        style={{ 
          width: '520px', 
          height: '520px', 
          background: 'linear-gradient(145deg, #e3e3e3, #ffffff)',
          padding: '12px',
          border: '1px solid #d1d1d1'
        }}
      >
        <div className="absolute inset-0 rounded-full border-[1.5px] border-black/5 pointer-events-none" />
        
        <div 
          className="relative w-[440px] h-[440px] rounded-full overflow-hidden bg-black shadow-[inset_0_0_40px_rgba(0,0,0,1)] flex items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 bg-neutral-950 opacity-20 pointer-events-none" />
          
          <div className="pointer-events-auto w-full h-full">
            <SmartKnob 
              state={state} 
              onStateChange={(updates) => setState(prev => ({ ...prev, ...updates }))}
              onRotate={handleRotationChange}
              isDragging={isDragging}
              showSubMenu={showSubMenu}
              setShowSubMenu={setShowSubMenu}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
