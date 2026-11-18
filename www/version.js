(async function(){
  function q(id){ return document.getElementById(id); }
  async function getJson(u){ try{ const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw new Error('http '+r.status); return await r.json(); }catch(_){ return null; } }
  async function resolveVersion(){
    const loc=await getJson('version.json');
    if(loc && (loc.version||loc.latest)) return String(loc.version||loc.latest);
    const a=await getJson('downloads/latest.json');
    if(a && (a.latest||a.version)) return String(a.latest||a.version);
    const b=await getJson('docs/version-mac.json');
    if(b && b.version) return String(b.version);
    return '';
  }
  function showOverlay(data){
    // 纸墨令牌 + 统一层级：高于登录层(2100)，Esc / 点遮罩 / 关闭按钮都能退出
    var bg=document.createElement('div');
    bg.className='wa-version-mask';
    bg.setAttribute('role','dialog');
    bg.setAttribute('aria-modal','true');
    bg.setAttribute('aria-label','版本详情');
    var panel=document.createElement('div');
    panel.className='wa-version-panel';
    var head=document.createElement('div');
    head.className='wa-version-head';
    var title=document.createElement('strong');
    title.textContent='版本详情 / Version details';
    var close=document.createElement('button');
    close.type='button'; close.className='wa-version-close';
    close.textContent='关闭'; close.setAttribute('aria-label','关闭版本详情');
    function dismiss(){
      try{ document.body.removeChild(bg); }catch(_){}
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e){ if(e.key==='Escape') dismiss(); }
    close.onclick=dismiss;
    bg.addEventListener('click', function(e){ if(e.target===bg) dismiss(); });
    document.addEventListener('keydown', onKey);
    head.appendChild(title); head.appendChild(close);
    var pre=document.createElement('pre');
    pre.className='wa-version-json';
    pre.textContent=JSON.stringify(data,null,2);
    panel.appendChild(head); panel.appendChild(pre);
    bg.appendChild(panel);
    document.body.appendChild(bg);
  }
  async function gatherDetails(){
    const local=await getJson('version.json');
    const latest=await getJson('downloads/latest.json');
    const mac=await getJson('docs/version-mac.json');
    return { local, latest, mac };
  }
  try{
    const vEl=q('appVersion'); if(!vEl) return;
    const v=await resolveVersion(); if(v){ vEl.textContent='v'+v; vEl.style.fontSize='11px'; vEl.style.color='var(--ink-3)'; vEl.style.whiteSpace='nowrap'; vEl.style.marginLeft='auto'; }
    // 信息栏“代码版本”显示与详情弹层（点击查看 version.json / latest.json / version-mac.json）
    try{
      const cEl=q('codeVersion');
      if(cEl && v){
        cEl.textContent=v;
        cEl.onclick=async function(ev){ ev.stopPropagation(); const d=await gatherDetails(); showOverlay(d); };
      }
    }catch(_){ }
    vEl.onclick=async function(){ const d=await gatherDetails(); showOverlay(d); };
  }catch(_){ }
})();