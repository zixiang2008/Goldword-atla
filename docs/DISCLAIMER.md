# 免责声明 / Disclaimer

> 本文件**完全参照**参考项目 [Word Atlas（词光）](https://github.com/H1DDENADM1N/word-atlas) 的
> [`LICENSE`](https://github.com/H1DDENADM1N/word-atlas/blob/main/LICENSE) 与
> [`CONTENT_LICENSE.md`](https://github.com/H1DDENADM1N/word-atlas/blob/main/CONTENT_LICENSE.md)
> 条款编写，并补充本项目作为二次集成作品的说明。使用、分发或构建本项目即表示你已阅读并同意以下全部内容。

## 0. 参考来源 / Source project

| 项目 | 地址 |
| :--- | :--- |
| **直接参考与资源来源** | **[H1DDENADM1N/word-atlas（词光 Word Atlas）](https://github.com/H1DDENADM1N/word-atlas)** |
| 上游原始项目 | [designfuchen/word-atlas](https://github.com/designfuchen/word-atlas) |
| 参考项目代码许可 | [MIT License](https://github.com/H1DDENADM1N/word-atlas/blob/main/LICENSE) |
| 参考项目内容许可 | [CC BY 4.0](https://github.com/H1DDENADM1N/word-atlas/blob/main/CONTENT_LICENSE.md) |

本项目复用了上述项目的界面设计、词库结构、插画、录音与技术方案，并作了适配性修改（见 [ATTRIBUTION.md](ATTRIBUTION.md)）。

---

## 1. 许可范围 / License scope

### 1.1 代码 / Code

参考项目的源代码与界面设计采用 **MIT License**：

```
MIT License

Copyright (c) 2026 Word Atlas contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

上述许可覆盖参考项目的项目代码、原创界面美术与技术文档。第三方依赖包保留各自许可；**Fraunces 字体采用 SIL Open Font License 1.1**。

### 1.2 词库内容、插画与录音 / Dataset, illustrations and recordings

以下资料以 **[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)** 提供，且在参考项目维护者能够授予的权利范围内：

- 词库文件（`data/`），以及 `public/atlas/index.json`、`public/atlas/entries/` 中的释义、英文释义、例句、译文、搭配、词族、近反义词、提示、分级与分类；
- `public/atlas/img/`、`public/atlas/thumb/`、`public/brand/` 中的插画；
- `public/atlas/audio/` 中的发音与例句录音。

**署名 / Attribution：** `Word Atlas contributors — CC BY 4.0`，并附授权链接 `https://creativecommons.org/licenses/by/4.0/`，同时说明是否做过修改（本项目**做过适配性修改**，详见 [ATTRIBUTION.md](ATTRIBUTION.md)）。

---

## 2. 参照 upstream 的免责说明 / Notes (mirrored from upstream)

- **单词与词表**：单个英文单词与通用词表本身不主张专有权。
  *This project claims no exclusive rights over English words or the bare headword list.*
- **AI 生成内容**：内容由 AI 模型按项目规范生成（文本：大语言模型；插画：图像模型；录音：ElevenLabs 合成语音），经过自动校验，**未逐条人工审校，按现状提供，不作准确性担保**。
  *Content was generated with AI models under the project's specifications, checked automatically, not proofread entry by entry, and is provided as-is without warranty.*
- **录音授权范围**：授权只涉及这些**完成的音频文件**，不包含底层声音模型、声音身份，或任何人的肖像权、人格权，也不表示声音提供方为本项目背书。英音声音为 ElevenLabs "Alice"，美音为 "Sarah"。
  *The recording license covers the finished audio files only, not the underlying voice models or voice identities, and implies no endorsement. Voices: ElevenLabs "Alice" (UK) and "Sarah" (US).*
- **非官方 IELTS**：本项目**不是官方雅思（IELTS）词表**，与雅思考试主办方（IELTS partners）无关。
  *Not an official IELTS list and not affiliated with the IELTS partners.*

---

## 3. 本项目的附加说明 / Additional notes for this project

- **独立集成**：Goldword-atlas 是独立开发与二次集成的作品，与 Word Atlas 维护者、贡献者、IELTS 主办方、ElevenLabs 及其他第三方均**无隶属、赞助或背书关系**。
- **使用风险**：本软件按「现状」（AS IS）提供，不保证适用于任何特定用途。因使用、修改、分发本软件或依赖其内容造成的任何损失，作者与内容提供方不承担责任。
- **学习用途**：词库内容可能存在错误、遗漏或过时，请以权威词典与教材为准；不要将内置例句或译文视为唯一正确解释。
- **GPT 增强**：该项为可选功能，需用户自行配置 OpenAI 兼容 API 与密钥。密钥仅保存在用户设备本地，不写入源码或 APK，本项目不收集、不中转、不托管任何密钥。模型输出由第三方服务生成，内容准确性、可用性与合规性由对应服务决定，本项目不作担保。请自行遵守所用服务的使用条款与当地法律法规。
- **商标与品牌**：Goldword-atlas、GoldWord、Word Atlas（词光）及相关名称、标识分别归各自权利人所有；本项目的引用仅为署名与技术说明目的。
- **资源分发**：仓库本身不含 726 MB 词库资源，构建时通过脚本从参考项目官方仓库获取；分发构建产物（APK 等）时必须随附本许可与署名文件。

---

## 4. 如何合规使用 / Compliance checklist

1. 保留本文件与 [`ATTRIBUTION.md`](ATTRIBUTION.md)，并在分发产物中附带；
2. 引用 `Word Atlas contributors — CC BY 4.0` 及授权链接，并说明本项目做过界面与字段映射等适配性修改；
3. 保留 MIT 许可声明与第三方依赖（含 Fraunces 字体）各自许可；
4. 不得宣称本项目为官方 IELTS 产品，或暗示 Word Atlas、IELTS 主办方、ElevenLabs 对本项目背书；
5. 遵守 GPT API 服务方条款，不在仓库或 APK 中提交任何密钥。
