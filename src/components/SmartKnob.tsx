import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MoveVertical, 
  Wind, 
  Maximize2,
  Snowflake,
  Flame,
  Droplets,
  RefreshCw,
  Power,
  MonitorUp,
  MonitorDown,
  Lightbulb,
  LightbulbOff,
  Minimize2,
  ArrowUpDown,
} from 'lucide-react';
import { ControllerState, ControllerMode, AcModeType, getModeBounds } from '../types';

interface SmartKnobProps {
  state: ControllerState;
  onStateChange: (updates: Partial<ControllerState>) => void;
  onRotate: (delta: number) => void;
  isDragging: boolean;
  showSubMenu: boolean;
  setShowSubMenu: (show: boolean) => void;
}

const CurtainIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="21" y2="3" />
    <path d="M4 4v17 Q12 15 20 21V4" />
  </svg>
);

const LightTubeIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="11" width="20" height="3" rx="1" strokeWidth="2" />
    <path d="M4 11v3M20 11v3" opacity="0.7" strokeWidth="1" />
    <path d="M7 8l-1-2M17 8l1-2M12 7V4" opacity="0.4" strokeWidth="1.5" />
  </svg>
);

const MODES: { id: ControllerMode; icon: React.ElementType }[] = [
  { id: 'curtain', icon: CurtainIcon },
  { id: 'ac', icon: Wind },
  { id: 'light', icon: LightTubeIcon },
  { id: 'table', icon: MoveVertical },
];

const TABLE_SUBMODES = [
  { id: 105, icon: MonitorUp, label: 'STAND' },
  { id: 75, icon: MonitorDown, label: 'SIT' },
];

const LIGHT_SUBMODES = [
  { id: 100, icon: Lightbulb, label: 'MAX' },
  { id: 50, icon: LightbulbOff, label: 'DIM' },
  { id: 0, icon: Power, label: 'OFF' },
];

const CURTAIN_SUBMODES = [
  { id: 100, icon: Maximize2, label: 'OPEN' },
  { id: 50, icon: Maximize2, label: 'HALF' },
  { id: 0, icon: Minimize2, label: 'CLOSE' },
];

// AC 模式循环顺序
const AC_MODE_CYCLE: AcModeType[] = ['auto', 'cool', 'dry', 'heat'];

// 每种 AC 模式的默认参数
const AC_MODE_DEFAULTS: Record<AcModeType, { temp: number; fan: number; swing: boolean }> = {
  auto: { temp: 24, fan: 2, swing: false },
  cool: { temp: 22, fan: 3, swing: true },
  dry: { temp: 24, fan: 1, swing: false },
  heat: { temp: 28, fan: 3, swing: true },
};

const getActiveColorClass = (modeId: string) => {
  switch (modeId) {
    case 'table': return 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]';
    case 'light': return 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.5)]';
    case 'ac': return 'bg-orange-500 text-white shadow-[0_0_20px_rgba(251,146,60,0.5)]';
    case 'curtain': return 'bg-indigo-400 text-white shadow-[0_0_20px_rgba(129,140,248,0.5)]';
    default: return 'bg-white text-black';
  }
};

export const SmartKnob: React.FC<SmartKnobProps> = ({ 
  state, 
  onStateChange,
  isDragging,
  showSubMenu,
  setShowSubMenu
}) => {
  const modeConfig = useMemo(() => {
    switch (state.mode) {
      case 'table': return { label: 'Table Height', color: '#06b6d4' };
      case 'ac': return { label: state.acPower ? `AC • ${state.acMode.toUpperCase()}` : 'AC • OFF', color: '#fb923c' };
      case 'light': return { label: 'Fluorescent Light', color: '#facc15' };
      case 'curtain': return { label: 'Smart Curtain', color: '#818cf8' };
    }
  }, [state.mode, state.acMode, state.acPower]);

  const bounds = getModeBounds(state.mode)!;
  const val = state.mode === 'table' ? state.tableHeight : 
              state.mode === 'ac' ? state.acTemp :
              state.mode === 'light' ? state.lightBrightness : state.curtainPosition;
  
  const progress = (val - bounds.min) / (bounds.max - bounds.min);
  const visualRotation = progress * 300; // 300 degrees out of 360
  const totalLength = 301.59;
  const arcLength = totalLength * (300 / 360);

  // 白点和轨道用同一份 val-derived visualRotation，保证始终同步
  const dotAngleRad = (120 + visualRotation) * (Math.PI / 180);
  const dotViewX = 50 + 48 * Math.cos(dotAngleRad);
  const dotViewY = 50 + 48 * Math.sin(dotAngleRad);


  return (
    <div className="relative w-full h-full flex items-center justify-center select-none touch-none">
      {/* Outer Ring Background (Apple Watch style track) */}
      <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle 
          cx="50" cy="50" r="48" 
          fill="none" stroke="#111" strokeWidth="2.5" 
          strokeDasharray={`${arcLength} ${totalLength}`}
          strokeDashoffset="0"
          transform="rotate(120 50 50)"
          strokeLinecap="round"
        />
        <motion.circle
          cx="50" cy="50" r="48" 
          fill="none" stroke="url(#progress-grad)" strokeWidth="3"
          strokeDasharray={totalLength}
          animate={{ strokeDashoffset: totalLength - progress * arcLength }}
          transform="rotate(120 50 50)"
          strokeLinecap="round"
          className="opacity-90 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
        />
      </svg>


      {/* Inner Controller Area */}
      <motion.div 
        animate={{ scale: isDragging ? 0.98 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={() => setShowSubMenu(prev => !prev)}
        className="relative w-[400px] h-[400px] rounded-full bg-black flex flex-col items-center justify-center overflow-hidden z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"
      >
        {/* 品牌/设备 Logo — 根据当前模式切换 */}
        <div className="absolute top-8 left-0 w-full text-center pointer-events-none select-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5">
            {(() => {
              switch (state.mode) {
                case 'table':
                  return (
                    <>
                      <svg className="w-3.5 h-3.5 text-cyan-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="4" y="2" width="16" height="4" rx="1" />
                        <path d="M8 6v4a4 4 0 0 0 8 0V6" />
                        <path d="M12 14v8" />
                        <path d="M8 22h8" />
                      </svg>
                      <span className="text-[9px] font-semibold text-white/40 tracking-[2px]">KAIDI</span>
                    </>
                  );
                case 'ac':
                  return (
                    <>
                      <svg className="w-3.5 h-3.5 text-orange-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6 12c0-4 2-8 6-8s6 4 6 8" />
                        <path d="M12 4v16" />
                        <path d="M9 16l3 3 3-3" />
                        <path d="M4 12h16" />
                      </svg>
                      <span className="text-[9px] font-semibold text-white/40 tracking-[2px]">MIDEA</span>
                    </>
                  );
                case 'light':
                  return (
                    <>
                      <svg className="w-3.5 h-3.5 text-yellow-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2" />
                        <path d="M12 21v2" />
                        <path d="M4.22 4.22l1.42 1.42" />
                        <path d="M18.36 18.36l1.42 1.42" />
                        <path d="M1 12h2" />
                        <path d="M21 12h2" />
                      </svg>
                      <span className="text-[9px] font-semibold text-white/40 tracking-[2px]">XIAOMI</span>
                    </>
                  );
                case 'curtain':
                  return (
                    <>
                      <svg className="w-3.5 h-3.5 text-indigo-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2" />
                        <path d="M12 21v2" />
                        <path d="M4.22 4.22l1.42 1.42" />
                        <path d="M18.36 18.36l1.42 1.42" />
                        <path d="M1 12h2" />
                        <path d="M21 12h2" />
                      </svg>
                      <span className="text-[9px] font-semibold text-white/40 tracking-[2px]">XIAOMI</span>
                    </>
                  );
              }
            })()}
          </div>
        </div>

        {/* 当前模式名称 */}
        <div className="absolute top-20 left-0 w-full text-center text-[13px] uppercase font-bold tracking-[4px] text-cyan-400/80 mix-blend-screen px-4 truncate transition-all">
          {modeConfig.label}
        </div>

        {/* Real Glass Effect */}
        <div className="absolute inset-0 z-50 pointer-events-none rounded-full overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[120%] h-[50%] bg-gradient-to-b from-white/20 to-transparent rotate-[-15deg] opacity-10" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-2xl block" />
          <div className="absolute inset-0 rounded-full border border-white/5" />
        </div>

        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${modeConfig.color} 0%, transparent 70%)` }} />

        {/* Central Value Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.mode + (showSubMenu ? '-sub' : '')}
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col items-center justify-center pt-2 z-30 cursor-pointer active:scale-95`}
            onClick={(e) => {
              e.stopPropagation();
              setShowSubMenu(!showSubMenu);
            }}
          >
            <div className="relative flex items-baseline pointer-events-none mb-1">
              <div className="text-[110px] font-extralight tracking-[-6px] text-white leading-none">
                {val}
              </div>
              <div className="text-3xl text-white/40 font-medium ml-2 uppercase absolute -right-16 bottom-6">
                {bounds.unit}
              </div>
            </div>
            {!showSubMenu ? (
              <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                Tap for options
              </div>
            ) : (
              <div className="text-[10px] text-white/40 tracking-wider mt-1">
                ↩ Tap to go back
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Circular Menu - Moved OUTSIDE the overflow-hidden div to ensure interactivity */}
      <div className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none">
        {showSubMenu ? (() => {
             if (state.mode === 'ac') {
               // ---- AC 副菜单：4 个交互按钮 ----
               const currentIdx = AC_MODE_CYCLE.indexOf(state.acMode);
               const nextMode = AC_MODE_CYCLE[(currentIdx + 1) % AC_MODE_CYCLE.length];
               
               // 当前模式的图标映射
               const modeIcons: Record<AcModeType, React.ElementType> = {
                 auto: RefreshCw, cool: Snowflake, dry: Droplets, heat: Flame,
               };
               const ModeIcon = modeIcons[state.acMode];
               
               const acItems = [
                 { 
                   id: 'ac-power', 
                   icon: Power, 
                   label: state.acPower ? 'ON' : 'OFF',
                   onActivate: () => onStateChange({ acPower: !state.acPower })
                 },
                 { 
                   id: 'ac-swing', 
                   icon: ArrowUpDown, 
                   label: state.acSwing ? 'ON' : 'OFF',
                   onActivate: () => onStateChange({ acSwing: !state.acSwing })
                 },
                 { 
                   id: 'ac-fan', 
                   icon: Wind, 
                   label: `FAN ${state.acFan}`,
                   onActivate: () => {
                     const next = state.acFan >= 5 ? 1 : state.acFan + 1;
                     onStateChange({ acFan: next });
                   }
                 },
                 { 
                   id: 'ac-mode', 
                   icon: ModeIcon, 
                   label: state.acMode.toUpperCase(),
                   onActivate: () => {
                     const defaults = AC_MODE_DEFAULTS[nextMode];
                     onStateChange({ acMode: nextMode, acTemp: defaults.temp, acFan: defaults.fan, acSwing: defaults.swing });
                   }
                 },
               ];

               return acItems.map((item, i) => {
                 const baseAngle = 90;
                 const offset = (i - (acItems.length - 1) / 2) * 38;
                 const angle = (baseAngle + offset) * (Math.PI / 180);
                 const radius = 155;
                 const x = Math.cos(angle) * radius;
                 const y = Math.sin(angle) * radius;
                 const isActive = item.id === 'ac-power' ? state.acPower :
                                  item.id === 'ac-swing' ? state.acSwing : true;
                 const activeClass = getActiveColorClass('ac');
                 const Icon = item.icon;

                 return (
                   <button
                     key={item.id}
                     onPointerDown={(e) => e.stopPropagation()}
                     onPointerUp={(e) => { e.stopPropagation(); item.onActivate(); }}
                     onClick={(e) => e.stopPropagation()}
                     className={`absolute w-14 h-14 rounded-full flex flex-col items-center justify-center pointer-events-auto transition-all duration-300 backdrop-blur-md z-[110] active:scale-125 ${
                       isActive ? activeClass + ' scale-110' : 'bg-white/10 text-white/50 hover:bg-white/20 border border-white/5'
                     }`}
                     style={{ transform: `translate(${x}px, ${y}px)` }}
                   >
                     <Icon size={20} />
                     <span className="text-[8px] font-bold mt-[2px] tracking-wider">{item.label}</span>
                   </button>
                 );
               });
             }
             else if (state.mode === 'table') {
               return TABLE_SUBMODES.map((m, i) => {
                 const baseAngle = 90;
                 const offset = (i - (TABLE_SUBMODES.length - 1) / 2) * 35;
                 const angle = (baseAngle + offset) * (Math.PI / 180);
                 const radius = 155;
                 const x = Math.cos(angle) * radius;
                 const y = Math.sin(angle) * radius;
                 const isActive = val === m.id;
                 const activeClass = getActiveColorClass(state.mode);
                 const Icon = m.icon;

                 return (
                   <button
                     key={m.id}
                     onPointerDown={(e) => e.stopPropagation()}
                     onPointerUp={(e) => { e.stopPropagation(); onStateChange({ tableHeight: m.id as number }); }}
                     onClick={(e) => e.stopPropagation()}
                     className={`absolute w-14 h-14 rounded-full flex flex-col items-center justify-center pointer-events-auto transition-all duration-300 backdrop-blur-md z-[110] active:scale-125 ${
                       isActive ? activeClass + ' scale-110' : 'bg-white/10 text-white/50 hover:bg-white/20 border border-white/5'
                     }`}
                     style={{ transform: `translate(${x}px, ${y}px)` }}
                   >
                     <Icon size={20} />
                     {m.label && <span className="text-[8px] font-bold mt-[2px] tracking-wider">{m.label}</span>}
                   </button>
                 );
               });
             }
             else if (state.mode === 'light') {
               return LIGHT_SUBMODES.map((m, i) => {
                 const baseAngle = 90;
                 const offset = (i - (LIGHT_SUBMODES.length - 1) / 2) * 35;
                 const angle = (baseAngle + offset) * (Math.PI / 180);
                 const radius = 155;
                 const x = Math.cos(angle) * radius;
                 const y = Math.sin(angle) * radius;
                 const isActive = val === m.id;
                 const activeClass = getActiveColorClass(state.mode);
                 const Icon = m.icon;

                 return (
                   <button
                     key={m.id}
                     onPointerDown={(e) => e.stopPropagation()}
                     onPointerUp={(e) => { e.stopPropagation(); onStateChange({ lightBrightness: m.id as number }); }}
                     onClick={(e) => e.stopPropagation()}
                     className={`absolute w-14 h-14 rounded-full flex flex-col items-center justify-center pointer-events-auto transition-all duration-300 backdrop-blur-md z-[110] active:scale-125 ${
                       isActive ? activeClass + ' scale-110' : 'bg-white/10 text-white/50 hover:bg-white/20 border border-white/5'
                     }`}
                     style={{ transform: `translate(${x}px, ${y}px)` }}
                   >
                     <Icon size={20} />
                     {m.label && <span className="text-[8px] font-bold mt-[2px] tracking-wider">{m.label}</span>}
                   </button>
                 );
               });
             }
             else if (state.mode === 'curtain') {
               return CURTAIN_SUBMODES.map((m, i) => {
                 const baseAngle = 90;
                 const offset = (i - (CURTAIN_SUBMODES.length - 1) / 2) * 35;
                 const angle = (baseAngle + offset) * (Math.PI / 180);
                 const radius = 155;
                 const x = Math.cos(angle) * radius;
                 const y = Math.sin(angle) * radius;
                 const isActive = val === m.id;
                 const activeClass = getActiveColorClass(state.mode);
                 const Icon = m.icon;

                 return (
                   <button
                     key={m.id}
                     onPointerDown={(e) => e.stopPropagation()}
                     onPointerUp={(e) => { e.stopPropagation(); onStateChange({ curtainPosition: m.id as number }); }}
                     onClick={(e) => e.stopPropagation()}
                     className={`absolute w-14 h-14 rounded-full flex flex-col items-center justify-center pointer-events-auto transition-all duration-300 backdrop-blur-md z-[110] active:scale-125 ${
                       isActive ? activeClass + ' scale-110' : 'bg-white/10 text-white/50 hover:bg-white/20 border border-white/5'
                     }`}
                     style={{ transform: `translate(${x}px, ${y}px)` }}
                   >
                     <Icon size={20} />
                     {m.label && <span className="text-[8px] font-bold mt-[2px] tracking-wider">{m.label}</span>}
                   </button>
                 );
               });
             };
          })() : (
          MODES.map((m, i) => {
            const baseAngle = 90;
            const offset = (i - (MODES.length - 1) / 2) * 40;
            const angle = (baseAngle + offset) * (Math.PI / 180);
            const radius = 155; 
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isActive = state.mode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onPointerDown={(e) => e.stopPropagation()} 
                onPointerUp={(e) => { 
                  e.stopPropagation(); 
                  onStateChange({ mode: m.id }); 
                }}
                onClick={(e) => e.stopPropagation()}
                className={`absolute w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto transition-all duration-300 backdrop-blur-md z-[110] active:scale-125 ${
                  isActive ? getActiveColorClass(m.id) + ' scale-110' : 'bg-white/10 text-white/50 hover:bg-white/20 border border-white/5'
                }`}
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <Icon size={26} />
              </button>
            );
          })
        )}
      </div>

      {/* 白点覆盖层：z-[200] 确保在最上层 */}
      <svg className="absolute w-full h-full pointer-events-none z-[200]" viewBox="0 0 100 100">
        <motion.circle
          animate={{ cx: dotViewX, cy: dotViewY, r: isDragging ? 3 : 1.5 }}
          fill="white"
          transition={{ duration: isDragging ? 0.08 : 0.15, ease: "easeOut" }}
          className="drop-shadow-[0_0_4px_rgba(255,255,255,1)]"
        />
      </svg>
    </div>
  );
};
