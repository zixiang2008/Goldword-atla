/**
 * Ambience / background sound — ported from word-atlas src/lib/sound.ts + ui/Ambience.tsx
 * Source: H1DDENADM1N/word-atlas (MIT code). Audio files are CC BY 4.0 (Word Atlas contributors).
 *
 * - Gapless Web Audio looping, cross-fade between tracks.
 * - Ducking: ambience volume drops while a word/recording is spoken.
 * - Selection and volume persist locally; audio only starts after a user gesture.
 */
(function () {
  'use strict';

  var BASE = 'sfx/';
  var TRACKS = [
    { id: 'stars',  label: '星空音乐',   icon: '✦' },
    { id: 'rain',   label: '雨天图书馆', icon: '☂' },
    { id: 'sea',    label: '清晨海岸',   icon: '≈' },
    { id: 'forest', label: '林间早晨',   icon: '♣' },
    { id: 'fire',   label: '夜晚壁炉',   icon: '♨' },
    { id: 'voyage', label: '远航船舱',   icon: '⛵' },
    { id: 'cafe',   label: '安静咖啡馆', icon: '☕' }
  ];
  var KEY_ID = 'gw:ambience', KEY_VOL = 'gw:ambienceVolume';
  var VALID = {}; TRACKS.forEach(function (t) { VALID[t.id] = true; });

  var ctx = null, master = null, amb = null;
  var buffers = {};
  var currentId = 'off', volume = 0.45, ducked = false, duckTimer = null;
  var armed = false, uiBound = false;

  function readStored() {
    try {
      var id = localStorage.getItem(KEY_ID);
      currentId = (id && VALID[id]) ? id : 'off';
      var v = parseFloat(localStorage.getItem(KEY_VOL));
      if (!isNaN(v) && v >= 0 && v <= 1) volume = v;
    } catch (_) {}
  }
  function store() {
    try { localStorage.setItem(KEY_ID, currentId); localStorage.setItem(KEY_VOL, String(volume)); } catch (_) {}
  }

  function audio() {
    if (ctx) { if (ctx.state === 'suspended') { try { ctx.resume(); } catch (_) {} } return ctx; }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try {
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    } catch (_) { ctx = null; }
    return ctx;
  }

  function load(file) {
    if (buffers[file]) return buffers[file];
    var c = audio();
    if (!c) return Promise.resolve(null);
    buffers[file] = fetch(BASE + file)
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
      .then(function (b) { return c.decodeAudioData(b); })
      .catch(function () { return null; });
    return buffers[file];
  }

  function level() { return volume * (ducked ? 0.35 : 1) * 0.9; }
  function fade(g, value, seconds) {
    if (!g || !ctx) return;
    var now = ctx.currentTime;
    try {
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(value, now + Math.max(0.01, seconds));
    } catch (_) { g.gain.value = value; }
  }

  function stopCurrent(fadeSeconds) {
    if (!amb) return;
    var old = amb; amb = null;
    fade(old.gain, 0, fadeSeconds || 1.0);
    try { old.src.stop(ctx.currentTime + (fadeSeconds || 1.0) + 0.1); } catch (_) {}
  }

  function play(id, vol) {
    if (typeof vol === 'number') volume = vol;
    currentId = id && VALID[id] ? id : 'off';
    store(); updateUI();
    if (currentId === 'off') { stopCurrent(1.2); return; }
    if (amb && amb.id === currentId) { fade(amb.gain, level(), .4); return; }
    stopCurrent(1.2);
    var c = audio();
    if (!c || !master) return;
    load('amb-' + currentId + '.mp3').then(function (buf) {
      if (!buf || currentId !== id || amb) return;
      var src = c.createBufferSource();
      src.buffer = buf; src.loop = true;
      // Skip decoder padding at both ends for a seamless loop (upstream behaviour).
      src.loopStart = 0.06;
      src.loopEnd = Math.max(0.07, buf.duration - 0.06);
      var g = c.createGain(); g.gain.value = 0;
      src.connect(g); g.connect(master);
      try { src.start(0, 0.06); } catch (_) { return; }
      amb = { id: id, src: src, gain: g };
      fade(g, level(), 2);
    });
  }

  function duck(on) {
    ducked = !!on;
    if (amb) fade(amb.gain, level(), on ? .15 : .6);
  }
  function duckFor(ms) {
    duck(true);
    if (duckTimer) clearTimeout(duckTimer);
    duckTimer = setTimeout(function () { duck(false); duckTimer = null; }, ms || 3000);
  }

  function updateUI() {
    var list = document.getElementById('waAmbList');
    if (list) {
      list.innerHTML = TRACKS.map(function (t) {
        return '<li><button type="button" data-amb="' + t.id + '" class="' + (currentId === t.id ? 'is-on' : '') + '" aria-pressed="' + (currentId === t.id) + '">' +
          '<span aria-hidden="true">' + t.icon + '</span><span>' + t.label + '</span>' + (currentId === t.id ? '<b>✓</b>' : '') + '</button></li>';
      }).join('') + '<li><button type="button" data-amb="off" class="' + (currentId === 'off' ? 'is-on' : '') + '" aria-pressed="' + (currentId === 'off') + '">' +
        '<span aria-hidden="true">◌</span><span>安静</span>' + (currentId === 'off' ? '<b>✓</b>' : '') + '</button></li>';
      list.querySelectorAll('[data-amb]').forEach(function (b) {
        b.onclick = function () { play(b.getAttribute('data-amb')); };
      });
    }
    var vol = document.getElementById('waAmbVol');
    if (vol) { vol.value = String(volume); vol.disabled = currentId === 'off'; }
    var btn = document.getElementById('waAmbBtn');
    if (btn) {
      btn.classList.toggle('is-on', currentId !== 'off');
      btn.setAttribute('aria-label', currentId === 'off' ? '环境声' : '环境声：' + (TRACKS.filter(function (t) { return t.id === currentId; })[0] || {}).label);
    }
  }

  function installUI() {
    if (uiBound) return;
    uiBound = true;
    var box = document.getElementById('waAmb');
    var btn = document.getElementById('waAmbBtn');
    var vol = document.getElementById('waAmbVol');
    if (btn && box) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var open = box.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      box.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', function () {
        box.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { box.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
      });
    }
    if (vol) {
      vol.oninput = function () {
        volume = parseFloat(vol.value) || 0;
        if (amb) fade(amb.gain, level(), .15);
        store();
      };
    }
    updateUI();
  }

  function armOnGesture() {
    var arm = function () {
      if (armed) return;
      armed = true;
      audio();
      if (currentId !== 'off') play(currentId);
    };
    document.addEventListener('pointerdown', arm, { once: true });
    document.addEventListener('keydown', arm, { once: true });
  }

  function installHooks() {
    // Every <audio> play (bundled recordings) lowers the ambience until it ends.
    var proto = window.HTMLMediaElement && HTMLMediaElement.prototype;
    if (proto && !proto._waAmbDuck) {
      var origPlay = proto.play;
      proto.play = function () {
        try { duck(true); } catch (_) {}
        var self = this;
        var release = function () { try { duck(false); } catch (_) {} };
        ['ended', 'pause', 'error'].forEach(function (ev) {
          try { self.addEventListener(ev, release, { once: true }); } catch (_) { self.addEventListener(ev, release); }
        });
        return origPlay.apply(this, arguments);
      };
      proto._waAmbDuck = true;
    }
    // Web Speech API.
    if (window.speechSynthesis && !window.speechSynthesis._waAmbDuck) {
      var origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = function (u) {
        duckFor(3500);
        try { if (u && u.addEventListener) u.addEventListener('end', function () { duck(false); }); } catch (_) {}
        return origSpeak(u);
      };
      window.speechSynthesis._waAmbDuck = true;
    }
    // Capacitor TTS plugin + GoldWord's own speakWord: time-boxed duck.
    if (window.App && !window.App._waAmbDuck) {
      var origSpeakWord = App.speakWord;
      if (origSpeakWord) {
        App.speakWord = function () { duckFor(4000); return origSpeakWord.apply(this, arguments); };
        App._waAmbDuck = true;
      }
    }
  }

  var Ambience = {
    play: play,
    duck: duck,
    duckFor: duckFor,
    tracks: TRACKS,
    current: function () { return currentId; }
  };
  window.Ambience = Ambience;

  function boot() { readStored(); installUI(); installHooks(); armOnGesture(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
