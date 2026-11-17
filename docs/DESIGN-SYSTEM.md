# Goldword-atlas 设计与代码规范 / Design System & Code Standard

> **本文件是本项目视觉与代码的最高准则。**
> 设计语言完整取自参考项目 [Word Atlas（词光）](https://github.com/H1DDENADM1N/word-atlas)
> 的 `src/styles/app.css`（MIT）。所有新增或修改的界面代码必须先符合本规范。
> 禁止引入与本文冲突的颜色、字体、圆角、阴影或交互模式。

---

## 1. 设计哲学

四个词：**纸、墨、田野图鉴、克制的金**。

- **纸**：温润的象牙纸底，带极淡的颗粒（risograph grain），不是纯白、不是灰底。
- **墨**：深蓝黑文字 + 衬线标题，像旧书与标本册。
- **田野图鉴**：赭石、鼠尾草绿、天青、紫李四色颜料，只用于强调与分类，不滥用。
- **克制的金**：金色只表示「点亮 / 已掌握 / 达成」，不做普通按钮底色。

界面应安静、留白充足、层次清晰；动效短促柔和，不能喧宾夺主。

## 2. 设计令牌（唯一来源：`www/atlas.css` 的 `:root`）

### 2.1 颜色

| 令牌 | 亮色 | 暗色 | 用途 |
| :--- | :--- | :--- | :--- |
| `--paper` | `#f6f1e7` | `#0d1120` | 页面底 |
| `--paper-2` | `#eee7d9` | `#151b2d` | 次级底、悬浮、seg 底 |
| `--paper-3` | `#e4dac8` | `#1e263b` | 进度槽、更深的底 |
| `--card` | `#fffdf8` | `#131a2b` | 卡片 / 面板 |
| `--card-2` | `#faf5ec` | `#19213a` | 卡片内次级块 |
| `--ink` | `#1a2035` | `#f2ebdd` | 主文字 / 主按钮底 |
| `--ink-2` | `#434b65` | `#c8c1b3` | 正文 |
| `--ink-3` | `#7a7d8a` | `#8d8c94` | 辅助文字 |
| `--ink-4` | `#aba79f` | `#5f6372` | 占位、极弱信息 |
| `--line` | `rgba(26,32,53,.10)` | `rgba(242,235,221,.08)` | 分隔线 |
| `--line-strong` | `rgba(26,32,53,.15)` | `rgba(242,235,221,.14)` | 边框、输入框 |
| `--terra` | `#c4573a` | `#e57c5a` | 主强调（主 CTA、当前项、提示图标） |
| `--terra-ink` | `#a8432a` | `#f29a7b` | 强调文字 |
| `--terra-soft` | `#f5ddd1` | `rgba(229,124,90,.16)` | 强调浅底 |
| `--ochre` | `#cb922c` | `#e8b65a` | 金色 / 自动播放 / 雅思标签 |
| `--ochre-soft` | `#f7e7c4` | `rgba(232,182,90,.15)` | 金色浅底 |
| `--sage` | `#6a8c63` | `#97b88e` | 掌握 / 正确 |
| `--sage-ink` | `#4b6b45` | `#b5d1ac` | 掌握文字 |
| `--sky` | `#5f88a8` | `#8fb2cc` | 词性 / 主题 |
| `--plum` | `#9a6283` | — | 极少量点缀 |

**硬性规则**

1. 任何界面代码不得写死 `#007AFF`、`#5856D6`、`#22c55e`、`#ef4444`、`#fff`、`#333` 等旧色值。
2. 只有「正确/掌握」用 sage，「错误/警告」用 terra；不得反过来。
3. 深浅主题必须同时可读；用 `color-mix(in srgb, var(--paper) 88%, transparent)` 做毛玻璃，不要写死 `rgba(255,255,255,...)`。

### 2.2 字体

- 衬线 `--serif`: Fraunces（Variable）→ Noto Serif CJK SC → Songti SC → Georgia
- 无衬线 `--sans`: `-apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, ...`
- 等宽 `--mono`: `ui-monospace, SF Mono, Menlo, Consolas`
- 正文 `400 15px/1.6 var(--sans)`；小字 `11–13px`；词头 `clamp(38px,5.6vw,84px)/1.02 var(--serif)`（`font-variation-settings:"opsz" 144`）。
- 眉标 `.eyebrow` / `.wa-eyebrow`：`600 11px/1.2`，`letter-spacing:.14em`，`text-transform:uppercase`，颜色 `--ink-3` 或 `--terra-ink`。
- 音标统一 `.ipa` 字体族；禁止用系统默认字体渲染 IPA。

### 2.3 圆角、阴影、动效

| 令牌 | 值 | 用途 |
| :--- | :--- | :--- |
| `--r-sm` | 10px | 小标签、进度条 |
| `--r` | 16px | 面板内块、筛选条 |
| `--r-lg` | 24px | 卡片、大面板 |
| `--r-xl` | 32px | 大弹层 |
| 胶囊 | `999px` | 所有按钮、chip、输入框 |

- `--shadow-sm` / `--shadow` / `--shadow-lg`：只用令牌，不自定义 box-shadow 数值（特殊光晕除外）。
- `--ease: cubic-bezier(.2,.8,.2,1)`；`--spring: cubic-bezier(.34,1.4,.5,1)`。
- 时长：hover 150–200ms，面板 250–420ms，翻卡 620ms。禁止 >700ms 的常规动效。
- 必须支持 `prefers-reduced-motion: reduce`：关闭非必要动画。

## 3. 布局规范

- 顶栏固定 `height:64px`、`z-index:300`，背景 `color-mix(in srgb, var(--paper) 88%, transparent)` + `backdrop-filter: blur(14px)`，底部 1px `--line`。
- 内容最大宽 `1180px`，左右 gutter `clamp(16px,3vw,40px)`；页面容器 `.wa-shell`。
- Z 轴层级（不得随意改动）：正文 1 < 顶栏 300 < 语言菜单 320 < 单词详情弹层 400 < 设置面板 1500 < 登录层 2000 / 2100。
- 卡片：正面左插画（占 1fr）+ 右词与音标（占 1fr）；背面沿用原左右两栏（3fr / 2fr）。窄屏 <760px 改为上下布局。
- 主页必须在平板一屏内看到「紧凑信息条 + 卡片 + 单行按钮 + 两行状态」。

## 4. 组件规范

| 组件 | 规范 |
| :--- | :--- |
| 主按钮 `.btn-primary` / `.buttons .flip-button` | 墨底纸字，胶囊，44px 高，hover 上浮 1px，active `scale(.97)` |
| 次按钮 `.btn-ghost` / `.buttons button` | 纸底 + `--line-strong` 边框 + `--ink-2` 文字 |
| 成功按钮 `.correct-button` | `--sage` 底白字（不是绿色 `#22c55e`） |
| 自动播放开启态 | `--ochre` 底白字 |
| Chip | 胶囊，24px 高，12px 字；难度 A/B/C 分别用 sage / sky / terra 的 soft 底色 |
| 输入框 / 下拉 | 胶囊或 10px 圆角，`--card-2` 底、`--line-strong` 边、`--ink` 字；focus ring 用 `--terra` 14% 透明 |
| 面板 / 弹层 | `--card` 底、`--line` 边、`--r-lg` 圆角、`--shadow-lg`；遮罩 `rgba(20,24,40,.42)` + blur 4–6px |
| Toast | 胶囊，墨底纸字，警告态 terra 底白字，z-index 最高 |
| 图鉴卡片 | 插画优先：正方形大图在上、词/中文在下，hover 上浮 3px，等级 chip 定位在图片右上角（父容器必须 `position:relative`） |
| 卡片背面（强制） | 必须在一页内呈现参考词条的**全部**信息：标本号 №、难度/主题 chip、原版插画、全部释义（词性+中文+英文）、全部例句（含音频按钮与译文）、全部搭配、词族/近义/反义、记忆提示与用法提醒；右栏保留 GoldWord 原有的单词/中文/英美双音标与发音/词性/记忆/联想/GPT 简述/要复习。内容可纵向滚动，但不得省略字段或截断列表 |
| 复习按钮行 | 纸墨胶囊：默认 `--card-2` 底 + `--line-strong` 边；「要记住」激活 `--sage`、「不记得」激活 `--terra`，禁止遗留蓝紫色 |
| 环境声入口 | 顶栏 36px 圆形图标按钮，开启时 `--terra` 色 + 三根跳动音量条；弹层 252px 宽、20px 圆角 |

## 5. 代码规范

### 5.1 文件职责

| 文件 | 职责 |
| :--- | :--- |
| `www/index.html` | 仅结构。禁止新增内联 `<style>` 与 `style="..."` 颜色；旧内联样式只在迁移期保留 |
| `www/atlas.css` | 唯一设计令牌与视觉覆盖层，最后加载；按本文分节组织 |
| `www/wordatlas.js` | 融合层：数据、卡片渲染、离线音频、图鉴、环境声、语言风格菜单 |
| `www/app.js` / `ui.js` / `db.js` | 原有 GoldWord 核心；尽量不直接改，用 monkey-patch 扩展 |
| `scripts/fetch-atlas-assets.sh` | 第三方资源拉取，仓库不入库资源（本轮需求变更后以最新仓库为准） |

### 5.2 命名与写法

- 新增 DOM id / class 一律 `wa-` 前缀；常量用大写下划线；函数名小驼峰。
- JS 用 ES5 兼容写法（`var` / `function`），因为 WebView 与旧平板兼容优先；异步可用 `Promise`/`async`。
- 所有用户可见字符串走 `esc()`；DOM 构造统一先拼字符串再 `innerHTML`，事件用事件委托或一次性绑定。
- 每个模块初始化函数必须幂等：`if (obj._installed) return; obj._installed = true;`
- 定时器与全局事件监听必须成对清理；弹层关闭时停止音频与动画。
- 单次交互主线程工作 < 50ms；列表超过 240 项必须分批渲染或虚拟滚动；图片必须 `loading="lazy"`。
- 不得在循环里 `querySelector` 同一节点；缓存 DOM 引用。
- 本地存储键统一 `gw:` 前缀，写入用 try/catch 包裹。

### 5.3 无障碍

- 图标按钮必须有 `aria-label` / `title`；弹层用 `role="dialog"` + `aria-modal`。
- 键盘可达：Esc 关闭弹层，`Ctrl/Cmd+K` 打开图鉴搜索，焦点态用 `:focus-visible` 双像素 `--terra` 描边。

## 6. 验收清单（每次改动后逐项确认）

- [ ] 颜色、字体、圆角、阴影全部来自令牌；`grep -E '#[0-9a-fA-F]{3,6}'` 在新增代码中只允许出现在 `atlas.css` 的 `:root` 段
- [ ] 亮色 / 暗色主题下所有文字对比度足够
- [ ] 顶栏、页签、按钮、chip、卡片、弹层、Toast 视觉一致
- [ ] 卡片正面左图右词、背面左右两栏映射完整
- [ ] 环境声可切换、可调音量、读单词时自动压低（duck）
- [ ] 图鉴 7,298 词滚动流畅，无一次性巨量 DOM
- [ ] 无重复事件绑定、无定时器泄漏、无控制台报错
- [ ] 在 1280×900 与平板竖屏两种尺寸下无布局溢出

## 7. 来源对照

| 规范条目 | 参考项目源码位置 |
| :--- | :--- |
| 色彩 / 字体 / 圆角 / 动效令牌 | `src/styles/app.css:1–108` |
| 纸纹背景 / 基础排版 | `src/styles/app.css:109–277` |
| 按钮 / icon-btn | `src/styles/app.css:278–386` |
| chip / segmented | `src/styles/app.css:387–523` |
| 顶栏 / 页面 / 面板 | `src/styles/app.css:524–832` |
| 词条卡 / 发音 / 例句 | `src/styles/app.css:933–1197` |
| 弹层 / 搜索面板 / Toast | `src/styles/app.css:1198–1432` |
| 图鉴筛选 / 搜索 | `src/styles/app.css:1939–2000` |
| 环境声选择器 | `src/styles/app.css:3444–3556`、`src/ui/Ambience.tsx`、`src/lib/sound.ts` |
| 减少动效 | `src/styles/app.css:3382–3443` |

---

**维护原则**：当参考项目更新设计令牌时，先更新本文，再同步 `atlas.css`，最后调整组件。不要反向操作。
