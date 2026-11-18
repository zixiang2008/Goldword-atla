/*
 * I18N — 界面文案桥接层
 * ------------------------------------------------------------------
 * 本应用历史上存在两套互不通信的语言状态：
 *   1) UI.applyLanguage() 使用 localStorage.appLanguage（zh/en/th/ja/es）
 *   2) I18N 使用 localStorage.goldword_language（zh-CN/en-US/en-GB）
 * 结果是点击语言菜单后 data-i18n 节点不更新、两套状态还会互相打架。
 * 现在以 UI 的短码为唯一状态源，I18N 作为它的跟随者：
 *   UI.applyLanguage() -> I18N.setLanguage(短码) -> 规范化长码 -> apply()
 */
const I18N = (function() {
    // 短码（界面菜单）与 BCP-47 长码（字典）的双向映射
    const ALIASES = {
        'zh': 'zh-CN', 'zh-CN': 'zh-CN', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-CN',
        'en': 'en-US', 'en-US': 'en-US', 'en-GB': 'en-GB',
        'th': 'th-TH', 'th-TH': 'th-TH',
        'ja': 'ja-JP', 'ja-JP': 'ja-JP',
        'es': 'es-ES', 'es-ES': 'es-ES'
    };
    function normalize(code) {
        if (!code) return 'zh-CN';
        var raw = String(code).replace('_', '-');
        return ALIASES[raw] || ALIASES[raw.toLowerCase()] || raw;
    }
    function readStored() {
        try {
            // appLanguage 是 UI 菜单写入的权威状态；旧 key 仅作兼容
            return localStorage.getItem('appLanguage') || localStorage.getItem('goldword_language') || '';
        } catch (_) { return ''; }
    }

    let lang = normalize(readStored()) || 'zh-CN';
    let dict = null;

    async function load() {
        try {
            const res = await fetch('language-system.json');
            if (!res.ok) throw new Error('http ' + res.status);
            dict = await res.json();
        } catch (e) {
            dict = {
                languages: {
                    'zh-CN': { name: '简体中文', rtl: false },
                    'en-US': { name: 'English', rtl: false },
                    'en-GB': { name: 'English (UK)', rtl: false },
                    'th-TH': { name: 'ภาษาไทย', rtl: false },
                    'ja-JP': { name: '日本語', rtl: false },
                    'es-ES': { name: 'Español', rtl: false }
                },
                translations: {
                    'zh-CN': { buttons: { personalCenter: '个人中心' } }
                }
            };
        }
    }

    function apply() {
        if (!dict) return;
        var available = dict.translations || {};
        if (!available[lang]) lang = 'zh-CN';
        const t = available[lang] || {};
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            const key = el.getAttribute('data-i18n');
            const parts = key.split('.');
            let cur = t;
            for (const p of parts) cur = (cur || {})[p];
            if (typeof cur === 'string') el.textContent = cur;
        });
        // 让 CSS :lang() 命中，字体栈据此选择泰文/日文/中文/拉丁字形
        document.documentElement.lang = lang;
        document.documentElement.dir = (((dict.languages || {})[lang] || {}).rtl) ? 'rtl' : 'ltr';
    }

    function setLanguage(code) {
        lang = normalize(code);
        try { localStorage.setItem('goldword_language', lang); } catch (_) {}
        apply();
    }

    async function init() {
        // 以 UI 菜单状态为准，避免刷新后两套系统显示不一致
        lang = normalize(readStored()) || lang;
        await load();
        apply();
    }

    return { init, setLanguage, apply, current: function() { return lang; } };
})();
window.I18N = I18N;
