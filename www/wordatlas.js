/**
 * GoldWord × Word Atlas  —  integration layer
 * ---------------------------------------------------------------
 * Word Atlas data / imagery / offline pronunciation are CC BY 4.0,
 * adapted from H1DDENADM1N/word-atlas (upstream designfuchen/word-atlas).
 *
 * Provides:
 *   window.WordAtlas  — offline dictionary, image + audio helpers
 *   UI.updateCard override — left image / right word+phonetics on the front;
 *                            original GoldWord layout on the back, enriched
 *                            with the full Word Atlas entry content.
 *   App.speakWord override — play bundled UK/US/ex recordings, fall back to
 *                            the existing TTS/GPT pipeline (offline first).
 *   Gallery ("图鉴") + word sheet + search + theme toggle.
 */
(function () {
  'use strict';

  var BASE = 'atlas/';
  var MEDIA = { img: 1, uk: 2, us: 4, ex: 8, ex2: 16 };

  var Atlas = {
    ready: false,
    id: '', name: '', count: 0,
    topics: [], cefr: [], chunk: 100,
    words: [], byId: null, byLower: null,
    _cache: {}, _pending: {},
    _full: null, _fullPromise: null
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function splitPair(s) {
    var p = String(s || '').split(/｜|\|/);
    return { en: (p[0] || '').trim(), zh: (p[1] || '').trim() };
  }
  function highlight(text, word) {
    var t = String(text || ''), w = String(word || '').trim();
    if (!w) return esc(t);
    try {
      var re = new RegExp('\\b(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'ig');
      return esc(t).replace(re, '<mark>$1</mark>');
    } catch (_) { return esc(t); }
  }

  Atlas.init = function () {
    if (this._initPromise) return this._initPromise;
    var self = this;
    this._initPromise = fetch(BASE + 'index.json')
      .then(function (r) { if (!r.ok) throw new Error('index ' + r.status); return r.json(); })
      .then(function (idx) {
        self.id = idx.id; self.name = idx.name; self.count = idx.count || 0;
        self.topics = idx.topics || []; self.cefr = idx.cefr || [];
        self.chunk = idx.chunk || 100;
        self.words = (idx.words || []).map(function (r, order) {
          return { id: r[0], word: r[1], zh: r[2], ipa: r[3], cefr: self.cefr[r[4]] || '',
            topic: self.topics[r[5]] ? self.topics[r[5]][0] : '',
            topicZh: self.topics[r[5]] ? self.topics[r[5]][1] : '', media: r[6], order: order };
        });
        self.byId = {}; self.byLower = {};
        self.words.forEach(function (w) { self.byId[w.id] = w; self.byLower[norm(w.word)] = w; });
        self.ready = true;
        try { window.dispatchEvent(new CustomEvent('wordatlas:ready')); } catch (_) {}
        return self;
      })
      .catch(function (e) { console.warn('[WordAtlas] index load failed:', e); return self; });
    return this._initPromise;
  };

  Atlas.find = function (wordOrId) {
    if (!this.ready) return null;
    var key = String(wordOrId || '').trim();
    return this.byId[key] || this.byLower[norm(key)] || null;
  };
  Atlas.findLoose = function (word) {
    if (!this.ready || !this.byLower) return null;
    var hit = this.find(word);
    if (hit) return hit;
    var clean = norm(String(word || '').replace(/\([^)]*\)/g, '').trim());
    return this.byLower[clean] || null;
  };

  Atlas.img = function (ref, size) {
    if (!ref || !(ref.media & MEDIA.img)) return null;
    return BASE + (size === 'thumb' ? 'thumb' : 'img') + '/' + ref.id + '.webp';
  };
  Atlas.audio = function (ref, kind) {
    if (!ref || !(ref.media & (MEDIA[kind] || 0))) return null;
    return BASE + 'audio/' + kind + '/' + ref.id + '.mp3';
  };

  Atlas.loadEntry = function (ref) {
    if (!ref) return Promise.resolve(null);
    if (this._cache[ref.id]) return Promise.resolve(this._cache[ref.id]);
    var n = Math.floor(ref.order / this.chunk);
    if (!this._pending[n]) {
      var self = this;
      this._pending[n] = fetch(BASE + 'entries/' + n + '.json')
        .then(function (r) { if (!r.ok) throw new Error('chunk ' + n); return r.json(); })
        .then(function (list) {
          list.forEach(function (e) { self._cache[e.id] = e; });
          return list;
        })
        .finally(function () { delete self._pending[n]; });
    }
    var self = this;
    return this._pending[n].then(function () { return self._cache[ref.id] || null; })
      .catch(function () { return null; });
  };

  /** Load the whole dictionary once (for GPT-miss search / suggestions only). */
  Atlas.loadFull = function () {
    if (this._full) return Promise.resolve(this._full);
    if (this._fullPromise) return this._fullPromise;
    var self = this;
    this._fullPromise = fetch(BASE + 'word-atlas.json')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) { self._full = list; return list; })
      .catch(function () { return []; });
    return this._fullPromise;
  };

  window.WordAtlas = Atlas;

  // ======================================================================
  // Audio — bundled recordings first, legacy TTS as fallback
  // ======================================================================
  var _audioEl = null, _audioToken = 0;
  function stopAudio() {
    _audioToken++;
    if (_audioEl) { try { _audioEl.pause(); } catch (_) {} _audioEl = null; }
  }
  function playUrl(url, rate) {
    if (!url) return Promise.resolve(false);
    stopAudio();
    var mine = _audioToken, a = new Audio(url);
    a.playbackRate = Math.max(0.4, Math.min(2.5, Number(rate) || 1));
    _audioEl = a;
    return a.play().then(function () {
      return new Promise(function (resolve) {
        a.onended = function () { if (mine === _audioToken) _audioEl = null; resolve(true); };
        a.onerror = a.onpause = function () { resolve(false); };
      });
    }).catch(function () { if (mine === _audioToken) _audioEl = null; return false; });
  }
  Atlas.playUrl = playUrl;
  Atlas.stopAudio = stopAudio;

  function currentAccent() {
    var v = (UI.elements.accent && UI.elements.accent.value) || 'en-US';
    return /GB|uk/i.test(v) ? 'uk' : 'us';
  }

  // Wrap App.speakWord: try offline word recording, then fall back to original.
  function installAudioOverride() {
    if (!window.App || App._waSpeakInstalled) return;
    var orig = App.speakWord.bind(App);
    App._waSpeakInstalled = true;
    App.speakWord = async function (word) {
      var current = (word != null) ? String(word)
        : (this.words && this.words[this.currentIndex] ? this.words[this.currentIndex].word : '');
      if (!current) return;
      var ref = Atlas.findLoose(current);
      var rate = parseFloat((UI.elements.speechRate && UI.elements.speechRate.value) || '1') || 1;
      var url = ref ? (Atlas.audio(ref, currentAccent()) || Atlas.audio(ref, 'uk') || Atlas.audio(ref, 'us')) : null;
      if (url) {
        var ok = await playUrl(url, rate);
        if (ok) return 'atlas';
      }
      return orig(word);
    };
    window.speakWord = function () { return App.speakWord(); };
  }

  // ======================================================================
  // Card rendering
  // ======================================================================
  function field(word, names) {
    if (!word) return '';
    for (var i = 0; i < names.length; i++) {
      var v = word[names[i]];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    var ai = word.aiEnhanced;
    if (ai) {
      var map = { chinese: 'chineseMeaning', phonetics: 'phonetic', pos: 'partOfSpeech',
        definition: 'definition', memory: 'memoryTip', association: 'association' };
      for (var i2 = 0; i2 < names.length; i2++) {
        if (map[names[i2]] && ai[map[names[i2]]]) return String(ai[map[names[i2]]]).trim();
      }
    }
    return '';
  }

  function renderFront(wordText, ref, entry) {
    var img = Atlas.img(ref);
    var uk = entry && entry.uk, us = entry && entry.us;
    var zh = entry && entry.senses && entry.senses.length ? entry.senses[0].zh : (ref ? ref.zh : '');
    var chips = [];
    if (ref && ref.cefr) chips.push('<span class="chip chip-level lv-' + esc(ref.cefr) + '">' + esc(ref.cefr) + '</span>');
    if (ref && ref.topicZh) chips.push('<span class="chip chip-topic">' + esc(ref.topicZh) + '</span>');
    if (!chips.length) chips.push('<span class="chip">GoldWord</span>');

    var pron = [];
    if (uk) pron.push('<button type="button" data-wa-audio="' + esc(Atlas.audio(ref, 'uk') || '') + '" data-wa-text="' + esc(wordText) + '"><em>英</em><span class="ipa">' + esc(uk) + '</span> 🔊</button>');
    if (us) pron.push('<button type="button" data-wa-audio="' + esc(Atlas.audio(ref, 'us') || '') + '" data-wa-text="' + esc(wordText) + '"><em>美</em><span class="ipa">' + esc(us) + '</span> 🔊</button>');
    if (!pron.length) {
      var ph = field(wordObjCache, ['phonetic', 'pronunciation', '音标']) || (ref ? ref.ipa : '');
      if (ph) pron.push('<button type="button" data-wa-audio="" data-wa-text="' + esc(wordText) + '"><em>IPA</em><span class="ipa">' + esc(ph) + '</span> 🔊</button>');
    }

    var specimen = ref ? '№ ' + String(ref.order + 1).padStart(4, '0') + ' <i></i> WORD ATLAS' : '<i></i> GOLDWORD';
    var front = document.querySelector('.flashcard-front');
    if (!front) return;
    front.innerHTML =
      '<div class="wa-front">' +
        '<div class="wa-art">' +
          (img ? '<img src="' + esc(img) + '" alt="' + esc(wordText) + ' 插画" loading="eager" onerror="this.style.display=\'none\'">' : '<div class="wa-art-empty">' + esc((wordText || '?').charAt(0).toUpperCase()) + '</div>') +
          '<div class="wa-art-chips">' + chips.join('') + '</div>' +
          '<div class="wa-art-hint">每一个词，都有一幅画 · ' + esc(ref ? ref.topicZh || '' : '自定义词库') + '</div>' +
        '</div>' +
        '<div class="wa-info">' +
          '<div class="wa-specimen">' + specimen + '</div>' +
          '<h2 class="word front-word" id="word">' + esc(wordText) + '</h2>' +
          '<div class="wa-pron">' + pron.join('') + '</div>' +
          '<div class="details" id="front-details">' + (zh ? '<div>' + esc(zh) + '</div>' : '') + '</div>' +
          '<div class="wa-front-tap">👆 点击「翻面」查看完整词条与记忆卡</div>' +
        '</div>' +
      '</div>';

    // keep UI element references valid after DOM replacement
    refreshElementRefs();
    if (UI.animateFrontWord) UI.animateFrontWord();
  }

  var wordObjCache = null;

  function renderBack(word, ref, entry) {
    var back = document.querySelector('.flashcard-back');
    if (!back) return;
    var wordText = field(word, ['word', '单词', '词', '英文', 'en']);
    var left = [], right = [];

    // ---- RIGHT column: original GoldWord layout (word / chinese / phonetic / pos / memo / assoc) ----
    var chinese = field(word, ['chinese', 'translation', '中文解释', '中文', '释义']);
    var phonetic = field(word, ['phonetic', 'pronunciation', '音标']) || (ref ? ref.ipa : '');
    var pos = field(word, ['pos', 'partOfSpeech', '词性']);
    var memo = field(word, ['mnemonic', '记忆要点', '记忆提示']);
    var assoc = field(word, ['association', '联想']);

    if (entry && entry.senses && entry.senses.length) {
      if (!chinese) chinese = entry.senses.map(function (s) { return s.zh; }).join('；');
      if (!pos) pos = entry.senses.map(function (s) { return s.pos; }).filter(Boolean).join(' ');
    }
    if (!memo && entry && entry.tip) memo = entry.tip;

    right.push('<div class="right-word">' + esc(wordText) + '</div>');
    right.push('<div class="wa-field"><span class="label">中文解释</span><span class="value">' + esc(chinese) + '</span></div>');
    right.push('<div class="wa-field"><span class="label">音标</span><span class="value">' + esc(phonetic) + '</span> ' +
      '<button type="button" class="wa-inline-speak" data-wa-audio="' + esc(ref ? (Atlas.audio(ref, currentAccent()) || '') : '') + '" data-wa-text="' + esc(wordText) + '">🔊</button></div>');
    right.push('<div class="wa-field"><span class="label">词性</span><span class="value">' + esc(pos) + '</span></div>');
    right.push('<hr class="wa-sep">');
    right.push('<div class="wa-field"><span class="label">记忆要点</span><span class="value">' + esc(memo) + '</span></div>');
    right.push('<div class="wa-field"><span class="label">联想</span><span class="value">' + esc(assoc) + '</span></div>');
    right.push('<div id="gpt-brief-block" class="wa-gpt-brief">✦ ' + esc((word && word.gptBrief) || '正在查询 GPT 补充…') + '</div>');
    right.push('<button id="dontRememberTopBtn" class="wa-review-btn" title="标记为需要复习">👎 要复习</button>');

    // ---- LEFT column: full Word Atlas content mapped into GoldWord's blocks ----
    if (entry && entry.senses && entry.senses.length) {
      left.push('<h3 class="wa-eyebrow">释义 · Senses</h3><ol class="wa-senses">' +
        entry.senses.map(function (s) {
          return '<li><span class="pos">' + esc(s.pos) + '</span><span class="zh">' + esc(s.zh) + '</span>' +
            (s.en ? '<span class="en">' + highlight(s.en, wordText) + '</span>' : '') + '</li>';
        }).join('') + '</ol>');
    } else {
      var def = field(word, ['definition', 'mainUsage', '定义', '用法']);
      if (def) left.push('<h3 class="wa-eyebrow">主要用法 / 定义</h3><div class="wa-field">' + esc(def) + '</div>');
    }

    // Examples — prefer atlas ex/ex2, fall back to GoldWord structured examples
    var examples = [];
    if (entry && entry.ex && entry.ex.length) {
      examples = entry.ex.slice(0, 3).map(function (x, i) {
        return { en: x.en, zh: x.zh, tag: entry.ex.length > 1 ? (i ? '雅思语境' : '日常') : '',
          audio: i === 0 ? Atlas.audio(ref, 'ex') : (i === 1 ? Atlas.audio(ref, 'ex2') : null) };
      });
    } else if (word && Array.isArray(word.examples)) {
      examples = word.examples.slice(0, 3).map(function (x) { return { en: x.en || '', zh: x.zh || '', tag: '', audio: null }; });
    } else if (word && word.example) {
      String(word.example).split(/\r?\n/).slice(0, 3).forEach(function (line) { examples.push({ en: line, zh: '', tag: '', audio: null }); });
    }
    if (examples.length) {
      left.push('<h3 class="wa-eyebrow">例句 · Examples</h3><ul class="wa-examples">' +
        examples.map(function (x) {
          return '<li>' + (x.tag ? '<span class="wa-ex-tag' + (x.tag === '雅思语境' ? ' is-ielts' : '') + '">' + esc(x.tag) + '</span>' : '') +
            '<p class="wa-ex-en">' + highlight(x.en, wordText) +
            ' <button type="button" class="wa-inline-speak" data-wa-audio="' + esc(x.audio || '') + '" data-wa-text="' + esc(x.en) + '">🔊</button></p>' +
            (x.zh ? '<p class="wa-ex-zh">' + esc(x.zh) + '</p>' : '') + '</li>';
        }).join('') + '</ul>');
    }

    // Collocations
    var cols = [];
    if (entry && entry.col && entry.col.length) {
      cols = entry.col.slice(0, 6).map(function (c) { var p = splitPair(c); return { en: p.en, zh: p.zh }; });
    } else {
      var c0 = (word && Array.isArray(word.collocations)) ? word.collocations
        : field(word, ['collocation', '固定搭配', '搭配']);
      if (Array.isArray(c0)) c0.forEach(function (c) {
        if (typeof c === 'string') { var p = splitPair(c.replace(/[（(]/g, '｜').replace(/[）)]/g, '')); cols.push({ en: p.en, zh: p.zh }); }
        else cols.push({ en: c.phrase || c.en || '', zh: c.meaning || c.zh || '' });
      });
      else if (c0) cols = String(c0).split(/\n|；|;/).map(function (c) { var p = splitPair(c); return { en: p.en, zh: p.zh }; });
    }
    if (cols.length) {
      left.push('<h3 class="wa-eyebrow">常用搭配 · Collocations</h3><ul class="wa-collocations">' +
        cols.map(function (c) { return '<li><span lang="en">' + esc(c.en) + '</span>' + (c.zh ? '<small>' + esc(c.zh) + '</small>' : '') + '</li>'; }).join('') + '</ul>');
    }

    // Relations: family / synonyms / antonyms
    var rel = [];
    if (entry && entry.fam && entry.fam.length) rel.push('<div><h3 class="wa-eyebrow">词族</h3><div class="wa-field">' + entry.fam.map(function (f) { return esc(f); }).join(' · ') + '</div></div>');
    if (entry && entry.syn && entry.syn.length) rel.push('<div><h3 class="wa-eyebrow">近义</h3><div class="wa-field">' + entry.syn.map(function (f) { return esc(typeof f === 'string' ? f : f.word); }).join(' · ') + '</div></div>');
    if (entry && entry.ant && entry.ant.length) rel.push('<div><h3 class="wa-eyebrow">反义</h3><div class="wa-field">' + entry.ant.map(function (f) { return esc(typeof f === 'string' ? f : f.word); }).join(' · ') + '</div></div>');
    if (rel.length) left.push(rel.join(''));

    if (entry && entry.tip) left.push('<aside class="wa-tip"><b>💡</b><span>' + esc(entry.tip) + '</span></aside>');
    if (entry && entry.note) left.push('<p class="wa-note">用法提醒：' + esc(entry.note) + '</p>');

    back.innerHTML = '<div class="wa-back"><div class="wa-back-left details" id="back-details">' + left.join('') +
      '</div><div class="wa-back-right">' + right.join('') + '</div></div>';

    refreshElementRefs();

    // review button state + wiring
    var rb = document.getElementById('dontRememberTopBtn');
    if (rb) {
      try {
        var all = DB.getAllWords(); var cur = all.find(function (w) { return w.word === wordText; }) || {};
        rb.classList.toggle('active', !!cur.needsReview);
      } catch (_) {}
      rb.onclick = function (e) {
        e.stopPropagation();
        try { App.markDontRemember(); } catch (_) {}
        rb.classList.toggle('active');
      };
    }
    bindInlineAudio(back);
    fetchBrief(wordText);
  }

  function refreshElementRefs() {
    try {
      UI.elements.wordFront = document.querySelector('.flashcard-front .word');
      UI.elements.detailsFront = document.querySelector('.flashcard-front .details');
      UI.elements.wordBack = document.querySelector('.flashcard-back .word');
      UI.elements.detailsBack = document.querySelector('.flashcard-back .details');
    } catch (_) {}
  }

  function bindInlineAudio(root) {
    root.querySelectorAll('[data-wa-audio]').forEach(function (btn) {
      if (btn._waBound) return; btn._waBound = true;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var url = btn.getAttribute('data-wa-audio') || '';
        var text = btn.getAttribute('data-wa-text') || '';
        var rate = parseFloat((UI.elements.speechRate && UI.elements.speechRate.value) || '1') || 1;
        if (url) playUrl(url, rate).then(function (ok) { if (!ok && text && App.speakWord) App.speakWord(text); });
        else if (text && App.speakWord) App.speakWord(text);
      });
    });
  }

  function fetchBrief(wordText) {
    if (!wordText || !UI.fetchGPTBrief) return;
    var holder = document.getElementById('gpt-brief-block');
    if (!holder) return;
    UI.fetchGPTBrief(wordText).then(function (txt) {
      var h = document.getElementById('gpt-brief-block');
      if (h && txt) h.textContent = '✦ ' + String(txt).slice(0, 160);
    }).catch(function () {});
  }

  // Override UI.updateCard — keeps GoldWord flip/navigation/GPT intact.
  function installCardOverride() {
    if (!window.UI || UI._waCardInstalled) return;
    UI._waCardInstalled = true;
    UI.updateCard = function (word) {
      if (!word) return;
      wordObjCache = word;
      var wordText = field(word, ['word', '单词', '词', '英文', 'en']);
      var ref = Atlas.findLoose(wordText);
      try { this.elements.correctButton && this.elements.correctButton.classList.remove('active'); } catch (_) {}
      renderFront(wordText, ref, null);
      if (this.elements.flashcard) {
        this.elements.flashcard.classList.remove('flipped');
        document.body.classList.remove('card-flipped');
      }
      if (ref) {
        Atlas.loadEntry(ref).then(function (entry) {
          if (wordObjCache !== word) return;
          renderFront(wordText, ref, entry);
          renderBack(word, ref, entry);
        });
      } else {
        // not in Word Atlas → original GPT-driven GoldWord rendering path
        renderFront(wordText, null, null);
        renderBack(word, null, null);
        Atlas.loadFull(); // warm cache for later lookups
      }
      try { if (UI.updateStats) UI.updateStats(); } catch (_) {}
    };
  }

  // Card click-to-flip on image (tablet friendly)
  function installCardClick() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-wa-audio]') || e.target.closest('button')) return;
      var art = e.target.closest('.wa-art');
      if (art && App.flipCard) App.flipCard();
    });
  }

  // ======================================================================
  // Gallery ("图鉴") + word sheet
  // ======================================================================
  var gallery = { filterLevel: '', filterTopic: '', status: 'all', query: '', limit: 60 };

  function buildFilters() {
    var box = document.getElementById('waFilters');
    if (!box || !Atlas.ready) return;
    var levels = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    var lv = levels.map(function (l) {
      return '<button type="button" class="chip-btn' + (gallery.filterLevel === l ? ' is-on' : '') + '" data-wa-level="' + l + '">' + (l || '全部难度') + '</button>';
    }).join('');
    var topics = ['',].concat(Atlas.topics.map(function (t) { return t[0]; }));
    var tp = topics.map(function (t) {
      var zh = t ? (Atlas.topics.find(function (x) { return x[0] === t; }) || [])[1] : '全部主题';
      return '<button type="button" class="chip-btn' + (gallery.filterTopic === t ? ' is-on' : '') + '" data-wa-topic="' + t + '">' + esc(zh || t) + '</button>';
    }).join('');
    box.innerHTML =
      '<div class="wa-filter-row"><span class="wa-row-label">难度</span>' + lv + '</div>' +
      '<div class="wa-filter-row"><span class="wa-row-label">主题</span>' + tp + '</div>';
    box.querySelectorAll('[data-wa-level]').forEach(function (b) {
      b.onclick = function () { gallery.filterLevel = b.getAttribute('data-wa-level'); gallery.limit = 60; buildFilters(); renderGallery(); };
    });
    box.querySelectorAll('[data-wa-topic]').forEach(function (b) {
      b.onclick = function () { gallery.filterTopic = b.getAttribute('data-wa-topic'); gallery.limit = 60; buildFilters(); renderGallery(); };
    });
  }

  function filteredWords() {
    var q = norm(gallery.query);
    return Atlas.words.filter(function (w) {
      if (gallery.filterLevel && w.cefr !== gallery.filterLevel) return false;
      if (gallery.filterTopic && w.topic !== gallery.filterTopic) return false;
      if (q && norm(w.word).indexOf(q) < 0 && String(w.zh).indexOf(gallery.query) < 0) return false;
      return true;
    });
  }

  function wordCardObj(ref, entry) {
    var senses = entry && entry.senses ? entry.senses : [];
    return {
      word: ref.word, pronunciation: ref.ipa, phonetic: entry ? entry.uk || entry.us : ref.ipa,
      partOfSpeech: senses.length ? senses[0].pos : '',
      chinese: senses.length ? senses.map(function (s) { return s.zh; }).join('；') : ref.zh,
      definition: senses.length ? senses[0].en : '',
      examples: entry && entry.ex ? entry.ex.map(function (x) { return { en: x.en, zh: x.zh }; }) : [],
      collocations: entry && entry.col ? entry.col.map(function (c) { var p = splitPair(c); return { en: p.en, zh: p.zh }; }) : [],
      mnemonic: entry ? entry.tip || '' : '', needsReview: false, isNewWord: true
    };
  }

  function renderGallery() {
    var grid = document.getElementById('waTiles');
    var meta = document.getElementById('waGalleryMeta');
    if (!grid || !Atlas.ready) return;
    var list = filteredWords();
    if (meta) meta.textContent = list.length.toLocaleString() + ' 个结果 · 显示全部原创插画，点击任意词卡开始学习';
    var shown = list.slice(0, gallery.limit);
    grid.innerHTML = shown.map(function (w) {
      var img = Atlas.img(w, 'thumb');
      return '<button type="button" class="wa-tile" data-wa-id="' + esc(w.id) + '">' +
        '<div class="illo">' + (img ? '<img loading="lazy" src="' + esc(img) + '" alt="' + esc(w.word) + '">' : '') +
        (w.cefr ? '<span class="chip chip-level lv-' + esc(w.cefr) + ' wa-tile-lv">' + esc(w.cefr) + '</span>' : '') + '</div>' +
        '<div class="wa-tile-text"><span class="wa-tile-word">' + esc(w.word) + '</span>' +
        '<span class="wa-tile-zh">' + esc(w.zh) + '</span></div></button>';
    }).join('');
    grid.querySelectorAll('[data-wa-id]').forEach(function (tile) {
      tile.onclick = function () { openWord(tile.getAttribute('data-wa-id')); };
    });
    var more = document.getElementById('waMore');
    if (more) { more.style.display = shown.length < list.length ? 'block' : 'none'; more.textContent = '显示更多（已显示 ' + shown.length + ' / ' + list.length + '）'; }
  }

  function openWord(id) {
    var ref = Atlas.byId[id];
    if (!ref) return;
    Atlas.loadEntry(ref).then(function (entry) {
      var sheet = document.getElementById('waSheet');
      var body = document.getElementById('waSheetBody');
      if (!sheet || !body) return;
      var wordText = ref.word;
      body.innerHTML = '<div class="wa-back">' +
        '<div class="wa-back-left details">' +
          (entry && entry.senses && entry.senses.length ? '<h3 class="wa-eyebrow">释义</h3><ol class="wa-senses">' +
            entry.senses.map(function (s) { return '<li><span class="pos">' + esc(s.pos) + '</span><span class="zh">' + esc(s.zh) + '</span>' +
              (s.en ? '<span class="en">' + highlight(s.en, wordText) + '</span>' : '') + '</li>'; }).join('') + '</ol>' : '') +
          (entry && entry.ex && entry.ex.length ? '<h3 class="wa-eyebrow">例句</h3><ul class="wa-examples">' +
            entry.ex.map(function (x, i) { return '<li>' + (entry.ex.length > 1 ? '<span class="wa-ex-tag' + (i ? ' is-ielts' : '') + '">' + (i ? '雅思语境' : '日常') + '</span>' : '') +
              '<p class="wa-ex-en">' + highlight(x.en, wordText) + ' <button type="button" class="wa-inline-speak" data-wa-audio="' +
              esc(i === 0 ? Atlas.audio(ref, 'ex') || '' : (i === 1 ? Atlas.audio(ref, 'ex2') || '' : '')) + '" data-wa-text="' + esc(x.en) + '">🔊</button></p>' +
              '<p class="wa-ex-zh">' + esc(x.zh) + '</p></li>'; }).join('') + '</ul>' : '') +
          (entry && entry.col && entry.col.length ? '<h3 class="wa-eyebrow">常用搭配</h3><ul class="wa-collocations">' +
            entry.col.map(function (c) { var p = splitPair(c); return '<li><span>' + esc(p.en) + '</span>' + (p.zh ? '<small>' + esc(p.zh) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '') +
          (entry && entry.tip ? '<aside class="wa-tip"><b>💡</b><span>' + esc(entry.tip) + '</span></aside>' : '') +
        '</div>' +
        '<div class="wa-back-right">' +
          '<div class="wa-chips">' + (ref.cefr ? '<span class="chip chip-level lv-' + esc(ref.cefr) + '">' + esc(ref.cefr) + '</span>' : '') +
            '<span class="chip chip-topic">' + esc(ref.topicZh || '') + '</span></div>' +
          '<p class="wa-specimen">№ ' + String(ref.order + 1).padStart(4, '0') + ' <i></i> WORD ATLAS</p>' +
          '<h2 class="right-word">' + esc(wordText) + '</h2>' +
          '<div class="wa-pron">' +
            (entry && entry.uk ? '<button type="button" data-wa-audio="' + esc(Atlas.audio(ref, 'uk') || '') + '" data-wa-text="' + esc(wordText) + '"><em>英</em><span class="ipa">' + esc(entry.uk) + '</span> 🔊</button>' : '') +
            (entry && entry.us ? '<button type="button" data-wa-audio="' + esc(Atlas.audio(ref, 'us') || '') + '" data-wa-text="' + esc(wordText) + '"><em>美</em><span class="ipa">' + esc(entry.us) + '</span> 🔊</button>' : '') +
          '</div>' +
          (Atlas.img(ref) ? '<img src="' + esc(Atlas.img(ref)) + '" alt="' + esc(wordText) + '" style="width:100%;border-radius:14px;margin-top:14px;box-shadow:var(--shadow-sm)">' : '') +
        '</div></div>';
      var acts = document.getElementById('waSheetActions');
      acts.innerHTML = '<button type="button" class="primary" id="waStudyThis">📚 加入学习卡</button>' +
        '<button type="button" id="waSpeakThis">🔊 朗读单词</button>' +
        '<button type="button" id="waCloseSheet">关闭</button>';
      bindInlineAudio(body); bindInlineAudio(acts);
      document.getElementById('waCloseSheet').onclick = closeSheet;
      document.getElementById('waSpeakThis').onclick = function () { if (App.speakWord) App.speakWord(wordText); };
      document.getElementById('waStudyThis').onclick = function () {
        var obj = wordCardObj(ref, entry);
        try {
          var all = DB.getAllWords();
          if (!all.some(function (w) { return w.word === obj.word; })) { all.unshift(obj); DB.saveFileData(all); }
          if (!App.words) App.words = all;
          var idx = App.words.findIndex(function (w) { return w.word === obj.word; });
          if (idx < 0) { App.words.unshift(obj); idx = 0; }
          App.currentIndex = idx;
        } catch (_) {}
        closeSheet(); switchView('study');
        if (UI.updateCard) UI.updateCard(obj);
      };
      sheet.classList.add('is-on');
    });
  }
  function closeSheet() { var s = document.getElementById('waSheet'); if (s) s.classList.remove('is-on'); }

  function switchView(name) {
    document.querySelectorAll('.wa-view').forEach(function (v) { v.classList.toggle('is-on', v.id === 'waView-' + name); });
    document.querySelectorAll('.wa-topnav button').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-wa-view') === name); });
    if (name === 'atlas') { buildFilters(); renderGallery(); }
    window.scrollTo(0, 0);
  }

  function installShell() {
    // Theme toggle
    var themeBtn = document.getElementById('waThemeBtn');
    if (themeBtn) {
      try { if (localStorage.getItem('gw:theme') === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); } catch (_) {}
      themeBtn.onclick = function () {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (dark) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', 'dark');
        try { localStorage.setItem('gw:theme', dark ? 'light' : 'dark'); } catch (_) {}
        themeBtn.textContent = dark ? '🌙' : '☀️';
      };
      if (document.documentElement.getAttribute('data-theme') === 'dark') themeBtn.textContent = '☀️';
    }
    // Nav
    document.querySelectorAll('.wa-topnav button').forEach(function (b) {
      b.onclick = function () {
        var v = b.getAttribute('data-wa-view');
        if (v === 'me') { var btn = document.getElementById('openAuthPageMainBtn'); if (btn) btn.click(); return; }
        switchView(v);
      };
    });
    // Search
    var search = document.getElementById('waSearch');
    if (search) {
      search.addEventListener('input', function () {
        gallery.query = search.value.trim(); gallery.limit = 60;
        if (document.getElementById('waView-atlas').classList.contains('is-on')) renderGallery();
      });
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { switchView('atlas'); renderGallery(); }
      });
    }
    var more = document.getElementById('waMore');
    if (more) more.onclick = function () { gallery.limit += 60; renderGallery(); };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSheet();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); switchView('atlas'); var s = document.getElementById('waSearch'); if (s) s.focus(); }
    });
    var mask = document.getElementById('waSheet');
    if (mask) mask.addEventListener('click', function (e) { if (e.target === mask) closeSheet(); });
    var x = document.getElementById('waSheetX');
    if (x) x.onclick = closeSheet;

    var dateEl = document.getElementById('waDate');
    if (dateEl) {
      try { dateEl.textContent = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }); } catch (_) {}
    }

    // 语言风格菜单：点击展开/收起二级选项，点击空白处关闭，Esc 关闭
    var styleMenu = document.getElementById('waStyleMenu');
    var styleTrigger = document.getElementById('waStyleTrigger');
    var stylePanel = document.getElementById('waStylePanel');
    function closeStyleMenu() {
      if (!styleMenu || !styleTrigger || !stylePanel) return;
      styleMenu.classList.remove('is-open');
      styleTrigger.setAttribute('aria-expanded', 'false');
      stylePanel.setAttribute('aria-hidden', 'true');
    }
    if (styleTrigger && stylePanel) {
      styleTrigger.onclick = function (e) {
        e.stopPropagation();
        var open = styleMenu.classList.toggle('is-open');
        styleTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        stylePanel.setAttribute('aria-hidden', open ? 'false' : 'true');
      };
      stylePanel.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', function (e) {
        if (styleMenu && !styleMenu.contains(e.target)) closeStyleMenu();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeStyleMenu(); });
    }
  }

  function boot() {
    installCardOverride();
    installAudioOverride();
    installCardClick();
    installShell();
    // re-render the current card with the new design (App.init ran before this listener)
    try {
      if (App.words && App.words[App.currentIndex]) UI.updateCard(App.words[App.currentIndex]);
    } catch (_) {}
    Atlas.init().then(function () {
      buildFilters(); renderGallery();
      try { if (new URLSearchParams(location.search).get('view') === 'atlas') switchView('atlas'); } catch (_) {}
      // Deep link: ?word=library (or 图鉴 share) opens that exact word.
      var requested = '';
      try { requested = new URLSearchParams(location.search).get('word') || ''; } catch (_) {}
      if (requested) {
        var ref = Atlas.findLoose(requested);
        if (ref) {
          Atlas.loadEntry(ref).then(function (entry) {
            var obj = wordCardObj(ref, entry);
            try {
              if (!App.words) App.words = DB.getAllWords();
              var i = App.words.findIndex(function (w) { return w.word === obj.word; });
              if (i < 0) { App.words.unshift(obj); i = 0; }
              App.currentIndex = i;
            } catch (_) {}
            try { UI.updateCard(obj); } catch (_) {}
          });
          return;
        }
      }
      // Once the atlas index is ready, re-render the current card so its
      // illustration and full entry appear on first load.
      try {
        if (App.words && App.words[App.currentIndex]) UI.updateCard(App.words[App.currentIndex]);
      } catch (_) {}
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
