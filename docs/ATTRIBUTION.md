# 内容署名 / Content Attribution

本项目内置并展示了来自 **Word Atlas（词光）** 的开放词库、原创插画与录音，遵循其 [内容许可 CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 进行署名。

## 署名信息 / Attribution statement

> **Word Atlas contributors (词光) — CC BY 4.0**
> 来源：<https://github.com/H1DDENADM1N/word-atlas>
> 许可：<https://creativecommons.org/licenses/by/4.0/>
> 上游原始项目：<https://github.com/designfuchen/word-atlas>
> 本项目对其界面设计、词条字段与卡片内容映射做了适配性修改（详见下文）。

## 使用的内容 / Material used

| 类别 | 数量 / 路径 | 说明 |
| :--- | :--- | :--- |
| 词条数据 | `www/atlas/index.json`、`www/atlas/entries/`（73 个分片）、`www/atlas/word-atlas.json` | 7,298 词条：释义、英文释义、例句、译文、搭配、词族、近反义词、记忆提示、难度分级与话题分类 |
| 插画 | `www/atlas/img/`（7,298 幅）、`www/atlas/thumb/`（7,298 幅） | 原版田野图鉴风格插画及缩略图 |
| 录音 | `www/atlas/audio/`（22,905 段） | 英音/美音单词发音、日常例句、雅思例句录音（ElevenLabs "Alice"/"Sarah" 合成） |
| 品牌素材 | `www/brand/` | 参考项目品牌图 |
| 界面设计 | `www/atlas.css`、`www/wordatlas.js` | 「纸墨」设计令牌、顶栏、图鉴画廊、词条详情、配色与排版方案的适配实现 |
| 字体 | Fraunces（随参考项目） | SIL Open Font License 1.1 |

以上资源由 `scripts/fetch-atlas-assets.sh` 从参考项目官方仓库拉取，不随本仓库代码提交。

## 本项目所做的修改 / Changes made in this project

1. **设计令牌适配**：将 Word Atlas 的纸墨设计系统改写为 `atlas.css`，覆盖 GoldWord 原有内联样式，适配平板横竖屏与深浅主题。
2. **卡片流程融合**：保留 GoldWord 的翻页、自动播放、记忆循环与答题按钮；词卡正面为「左插画 + 右单词与英/美音标」，背面在原左右两栏中映射 word-atlas 的全字段内容。
3. **离线发音接入**：将 word-atlas 的英美单词录音与例句录音接入 GoldWord 原有发音流程，保留原 TTS / GPT 管线作为词库外单词的兜底。
4. **图鉴与详情**：新增难度（A1–C2）、话题（19 类）筛选，中英文搜索，词条详情弹层与一键加入学习卡。
5. **主页交互优化**：紧凑信息条、单行按钮组与「语言风格」二级菜单、个人中心层级修复、底部状态两行化。

## 本项目原有部分 / Original work

GoldWord 原有的卡片记忆引擎、间隔复习逻辑、GPT / OpenAI 兼容 API 接入、用户账号与设置、本地存储与 Android 构建管线仍为本项目原有代码，不属于上述第三方署名范围。

完整许可与免责条款见 [DISCLAIMER.md](DISCLAIMER.md)。
