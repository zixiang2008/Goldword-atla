# Goldword-atlas — 融合版说明 (v0.1)

> 版本变更：原 GoldWord 2.1.4 已更名为 **Goldword-atlas**，版本号从 **0.1** 重新开始。
> v0.1 UI 调整：顶部 hero 压缩为单行固定条、功能按钮并为单行并新增「语言风格」二级菜单、
> 修复个人中心被卡片遮挡、底部系统/用户/学习信息压缩为两行。详见 `outputs/INSTALL-README.md`。

## 概览

本版本将 [Word Atlas（词光）](https://github.com/H1DDENADM1N/word-atlas) 的完整
UI 设计、7,298 词开放词库、原创插画与离线发音，融合进 GoldWord 原有的卡片翻页
背单词流程。专为 vivo Pad 3 等安卓平板侧载测试构建。

## 完成的内容

1. **UI 完全采用 word-atlas 的「纸墨」设计系统** — 新增 `atlas.css`，包含纸色背景、
   衬线标题、颗粒质感、橄榄/赭石/青蓝配色、圆角卡片与顶栏导航（今日 / 图鉴 / 我的）、
   搜索框、深浅主题切换。
2. **发音与资料全部内置 word-atlas** — `www/atlas/` 内含 7,298 幅插画（img/thumb）、
   22,905 段录音（英音 uk / 美音 us / 日常例句 ex / 雅思例句 ex2）、73 个词条分片与
   完整词库 JSON。全部离线，运行时零网络请求。
   - 正面卡片可分别点击「英 / 美」音标按钮播放对应录音。
   - 背面例句分别调用 ex / ex2 录音。
3. **保留 GoldWord 卡片翻页** — App 的 `flipCard / nextCard / prevCard`、记忆循环、
   自动播放、倒计时、答题按钮等逻辑全部保留。
   - 卡片正面：**左半幅插画 + 右半幅单词与英/美音标**。
   - 卡片背面：保留原有左右两栏布局，并映射入 word-atlas 的全部字段
     （多义项释义、日常/雅思例句、常用搭配、词族、近义、反义、记忆提示、用法提醒）。
4. **GPT 能力保留** — 不在 word-atlas 词库中的单词（用户自定义词库约 37%）自动回退到
   原有 GPT 增强服务与 `fetchGPTBrief`；音标/中文/例句仍由 GPT 补全，格式与位置不变。
   API Key 仍只在「个人中心 → GPT 设置」中本机填写，不写入源码或 APK。
5. **图鉴画廊** — 全词库按难度（A1–C2）与 19 个话题筛选、中文/英文搜索，点击词卡可
   查看详情并把该词加入学习卡。支持 `?word=library` 深链与 `?view=atlas` 直达。

## 关键文件

- `www/atlas.css` — word-atlas 设计系统（适配 GoldWord DOM）
- `www/wordatlas.js` — 词库加载、卡片渲染覆盖、离线发音、图鉴与详情
- `www/index.html` — 顶栏 / 视图容器 / 图鉴 / 详情弹层
- `www/atlas/` — 内置词库、插画、录音（CC BY 4.0）
- `www/ATTRIBUTION.md` — 内容署名与授权说明

## 署名

Word Atlas 词库、插画与录音版权归 Word Atlas contributors（词光）所有，采用
CC BY 4.0 授权。详见 `www/ATTRIBUTION.md` 与原项目仓库。

## 构建

```bash
export JAVA_HOME=/c/jdk21/jdk-21.0.10+7
export ANDROID_HOME=/c/android-sdk
export ANDROID_KEYSTORE_PATH=app/keystore/goldword-release.jks
# ... 密码通过环境变量传入，不落盘到源码
cd android && ./gradlew assembleRelease
```

产物：`outputs/GoldWord-<version>-wordatlas-signed.apk`
