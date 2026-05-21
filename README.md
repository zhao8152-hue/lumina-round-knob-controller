# Lumina Round Knob Controller

一款智能家居多模式旋钮屏控制器交互原型演示，支持 **升降桌 / 空调 / 灯光 / 窗帘** 四种设备的触控旋钮操控。

> **项目性质**：交互原型 / 演示 Demo / UI 组件库  
> **适用阶段**：产品概念验证、UI 设计评审、交互流程展示

---

## 功能特性

### 四种控制模式

| 模式 | 设备品牌 | 控制参数 | 二级菜单 |
|------|---------|---------|---------|
| 升降桌 | KAIDI | 高度 60–120 cm | STAND / SIT 预设 |
| 空调 | MIDEA | 温度 16–30 °C | 电源/摇摆/风量/模式(自动/制冷/除湿/制热) |
| 灯光 | XIAOMI | 亮度 0–100% | MAX / DIM / OFF 预设 |
| 窗帘 | XIAOMI | 开合 0–100% | OPEN / HALF / CLOSE 预设 |

### 交互亮点

- **径向旋转手势** — 绕旋钮边缘拖拽即可调节数值，采用切向投影算法实现精准感应
- **触控反馈** — 拖拽时面板微微缩放，提供物理按压感
- **模式切换** — 点击旋钮边缘呼出圆形菜单，4 模式一键切换
- **空调二级菜单** — 电源/摇摆/风量/模式四按钮，支持独立状态管理
- **5 秒自动返回** — 二级菜单无操作 5 秒自动回到主视图
- **Apple Watch 风格进度环** — 300° 弧形进度条，青蓝渐变过渡
- **玻璃质感叠加层** — 倾斜反射 + 右下角柔光模糊，增强 UI 层次感

---

## 技术栈

| 层 | 技术 |
|------|---------|
| 框架 | [React 19](https://react.dev/) |
| 动画 | [Motion (Framer Motion)](https://motion.dev/) |
| 构建 | [Vite 6](https://vite.dev/) |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com/) |
| 图标 | [Lucide React](https://lucide.dev/) (v0.546) |
| 字体 | [Inter](https://rsms.me/inter/) |
| 语言 | TypeScript |

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产包
npm run build
```

构建产物位于 `dist/` 目录，可直接部署至静态托管服务。

---

## 项目结构

```
lumina-round-knob-controller/
├── src/
│   ├── main.tsx                 # 入口
│   ├── App.tsx                  # 根组件（状态管理、手势绑定）
│   ├── index.css                # 全局样式 + Tailwind 主题
│   ├── types.ts                 # 类型定义 + 模式常量 + 边界参数
│   ├── components/
│   │   └── SmartKnob.tsx        # 核心旋钮 UI 组件
│   └── hooks/
│       └── useRadialRotation.ts # 径向旋转手势 Hook
├── dist/
│   ├── index.html               # 构建入口
│   ├── modao-import.html        # 墨刀 UI 元素素材库（HTML 预览）
│   ├── smart-knob-standalone.html # 独立版完整旋钮（可离线打开）
│   └── elements-svg/            # 所有 UI 元素的独立 SVG 文件
│       ├── icons/               # 全部图标（自定义 + Lucide）
│       ├── brand/               # 品牌徽章（KAIDI / MIDEA / XIAOMI）
│       ├── mode-buttons/        # 模式切换按钮（活跃/非活跃态）
│       ├── presets/             # 预设快捷按钮
│       ├── ui/                  # 进度环、玻璃效果、辉光
│       ├── units/               # 单位符号（cm / °C / %）
│       └── digits/              # 数字 0–9
├── export-svgs.py               # SVG 导出脚本（按需重建）
└── package.json
```

---

## 架构设计

### 状态管理

采用 `useState` 集中管理所有设备状态，通过 `handleRotationChange` 回调统一处理旋钮输入：

```
用户拖拽 → useRadialRotation (角度增量)
         → deltaAccumulator (跨帧累加器)
         → step 阈值检测 → setState
```

跨帧累加器解决了 `Math.round` 舍入吞增量问题，保证精密调节场景下的手感一致性。

### 手势算法

`useRadialRotation` 采用 **鼠标位移切向投影算法**：

1. 计算指针位移向量
2. 投影到当前半径位置的切向方向
3. 弧长 → 角度转换（避免 `atan2` 环绕跳变）
4. > 0.1° 噪声门限过滤抖动

### 独立并行设计

App 与嵌入式固件独立并行开发，仅需约定通信接口（当前通过 React state 模拟），后续可替换为 BLE/Serial 数据源。

---

## UI 元素导出

项目内所有 UI 元素（图标、按钮、品牌 Logo、单位符号等）已导出为独立 SVG 文件，方便设计师在 Figma / 墨刀 / Sketch 中使用：

```bash
python export-svgs.py
```

导出产物位于 `dist/elements-svg/`，共 **70 个 SVG 文件**，按类型分目录存放。

---

## License

Apache-2.0
