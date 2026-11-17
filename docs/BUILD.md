# 构建指南 / Build Guide

Goldword-atlas 0.1 · Capacitor 8.6.2 · Android API 36

## 1. 环境准备

| 依赖 | 版本 / 说明 |
| :--- | :--- |
| Node.js | 18+（推荐 20 LTS） |
| JDK | 21（Gradle 8.13、AGP 8.13） |
| Android SDK | Platform 36、Build Tools 36.0.0 |
| Git | 任意现代版本（含 Git Bash，Windows 拉取脚本需要） |
| 磁盘 | 源码约 20 MB；资源约 726 MB；构建额外预留 2 GB |

在 `android/local.properties` 或通过环境变量设置 `ANDROID_HOME` / `ANDROID_SDK_ROOT` 指向 Android SDK。

## 2. 获取源码与资源

```bash
git clone https://github.com/zixiang2008/Goldword-atla.git
cd Goldword-atla
npm install
```

仓库**不包含** 726 MB 词库资源（37,576 个文件），需要单独拉取：

```bash
# macOS / Linux / Git Bash
bash scripts/fetch-atlas-assets.sh

# Windows：双击 scripts\fetch-atlas-assets.cmd
# 或 PowerShell / CMD：scripts\fetch-atlas-assets.cmd
```

脚本行为：

1. 下载 [H1DDENADM1N/word-atlas](https://github.com/H1DDENADM1N/word-atlas) `main` 分支源码包到 `.cache/word-atlas-main.tar.gz`（约 566 MB，已有则复用）；
2. 解压到 `.cache/word-atlas-main/`；
3. 复制 `public/atlas/index.json`、`data/word-atlas.json` 及 `entries/`、`img/`、`thumb/`、`audio/` 到 `www/atlas/`，`public/brand/` 到 `www/brand/`；
4. 校验插画、录音、词条分片数量，任一缺失即以非零码退出。

可用环境变量：`ATLAS_REF=main` 指定分支/commit，缓存目录固定为项目根下 `.cache/`（已加入 `.gitignore`）。

> 资源来自第三方开源项目，使用前请阅读 [DISCLAIMER.md](DISCLAIMER.md)。

## 3. Web / PWA 预览

```bash
npx serve www
# 或：python -m http.server 8080 -d www
```

浏览器打开 `http://localhost:3000`（或对应端口）。调试深链：

- `?word=library` — 直接打开该词卡；
- `?view=atlas` — 打开图鉴画廊。

> 不要用 `file://` 直接打开 `index.html`：部分浏览器会拦截本地资源加载与 fetch。

## 4. Android 构建

### 4.1 同步 Web 资源

```bash
npx cap sync android
```

该命令把 `www/` 全部内容复制到 `android/app/src/main/assets/public/`。若安全策略阻止其删除/覆盖步骤，可手工复制变更文件：

```bash
for f in atlas.css index.html manifest.json ui.js version.js version.json wordatlas.js; do
  cp "www/$f" "android/app/src/main/assets/public/$f"
done
cp www/downloads/latest.json android/app/src/main/assets/public/downloads/latest.json
cp capacitor.config.json android/app/src/main/assets/capacitor.config.json
```

### 4.2 生成签名密钥（仅需一次）

```bash
mkdir -p android/app/keystore
keytool -genkeypair -v \
  -keystore android/app/keystore/goldword-release.jks \
  -alias goldword -keyalg RSA -keysize 2048 -validity 10000
```

密钥库与口令**不得提交到仓库**（`.gitignore` 已排除）。

### 4.3 构建与签名

方式 A — Gradle 直接签名（需设置环境变量，keystore 用绝对路径）：

```bash
export JAVA_HOME=/path/to/jdk21
export ANDROID_HOME=/path/to/android-sdk
export ANDROID_KEYSTORE_PATH="$PWD/android/app/keystore/goldword-release.jks"
export ANDROID_KEYSTORE_STORE_PASSWORD='<store-password>'
export ANDROID_KEYSTORE_ALIAS=goldword
export ANDROID_KEYSTORE_KEY_PASSWORD='<key-password>'
cd android && ./gradlew assembleRelease --no-daemon
```

方式 B — 先构建后手工对齐签名（可确保 v1+v2+v3 全覆盖）：

```bash
cd android && ./gradlew assembleRelease --no-daemon && cd ..
BUILD_APK=android/app/build/outputs/apk/release/app-release.apk
zipalign -f -p 4 "$BUILD_APK" outputs/aligned.apk
apksigner sign \
  --ks android/app/keystore/goldword-release.jks \
  --ks-key-alias goldword \
  --ks-pass "pass:<store-password>" \
  --key-pass "pass:<key-password>" \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out outputs/Goldword-atlas-0.1-signed.apk outputs/aligned.apk
apksigner verify --verbose --print-certs outputs/Goldword-atlas-0.1-signed.apk
```

Windows（Git Bash）中 `apksigner` 需写为 `apksigner.bat`。

### 4.4 安装到设备

```bash
adb install -r outputs/Goldword-atlas-0.1-signed.apk
```

- 包名 `com.goldword.app`，应用名 **Goldword-atlas**，versionCode 3 / versionName 0.1。
- 与旧版 GoldWord 使用不同证书时会提示签名冲突，先卸载旧版。
- 首次启动前请预留约 2 GB 空间（APK 约 639 MB + 资源解压）。

## 5. 验证

```bash
npm test                    # 核心逻辑测试
node --check www/wordatlas.js
node --check www/ui.js

# APK 内容抽查
python - <<'PY'
import zipfile
z = zipfile.ZipFile('outputs/Goldword-atlas-0.1-signed.apk')
n = z.namelist()
print('images:', sum(1 for x in n if x.startswith('assets/public/atlas/img/')))
print('audio :', sum(1 for x in n if x.startswith('assets/public/atlas/audio/')))
PY
```

预期：图片 7,298、音频 22,905。

## 6. 常见问题

| 现象 | 原因 / 处理 |
| :--- | :--- |
| 卡片没有插画、发音按钮无声 | 未执行资源拉取脚本，或 `npx cap sync` 后未重新构建 APK |
| `Release signing disabled ... building unsigned APK` | keystore 路径错误或环境变量缺失；用绝对路径或按 4.3 方式 B 手工签名 |
| `apksigner: command not found` | Windows Git Bash 用 `apksigner.bat`，并确认 Build Tools 在 PATH |
| 页面样式错乱、仍是旧 UI | `atlas.css` 必须是 `</head>` 前最后一个样式表；检查 `www/index.html` 顺序 |
| 图鉴右上角出现游离的等级徽章 | `.wa-tile .illo` 需保持 `position: relative` |
| GPT 功能不可用 | API 在「个人中心 → GPT 设置」中填写；密钥只存本地，不入库 |

## 7. 资源与许可

构建与分发时请附带 [`ATTRIBUTION.md`](ATTRIBUTION.md) 和 [`DISCLAIMER.md`](DISCLAIMER.md)，并遵守 CC BY 4.0 署名要求。
