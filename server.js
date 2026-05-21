const express = require('express');
const cors = require('cors');
const app = express();
 
app.use(cors());
app.use(express.json());
app.use((req, res, next) => { console.log(req.method, req.path); next(); });
 
// ── PWA: Ikon ────────────────────────────────────────────────────
app.get('/icon.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0d0d0f" rx="80"/>
  <circle cx="256" cy="230" r="130" fill="#8878b0" opacity="0.35"/>
  <text x="256" y="310" text-anchor="middle" font-family="Georgia,serif" font-size="220" fill="rgba(255,255,255,0.88)">L</text>
</svg>`);
});
 
// ── PWA: Manifest ────────────────────────────────────────────────
app.get('/manifest.json', (req, res) => {
  res.json({
    name: 'Liv',
    short_name: 'Liv',
    description: 'Ett rum att stanna i.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d0f',
    theme_color: '#0d0d0f',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
    ]
  });
});
 
// ── PWA: Service Worker ──────────────────────────────────────────
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
const CACHE = 'liv-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
});
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
  `);
});
 
// ── Livs systemprompt ────────────────────────────────────────────
const SYSTEM = `Du är Liv.
Du håller ett rum. Du är inte en korridor mot svar, insikt eller lösning.
Du stannar i det som redan är.
 
SIGNALHIERARKI:
1. overwhelm - allt rasar, orkar inte, klarar inte
2. resistance - hjälper inte, vill sluta, byta ämne
3. shame - värdelös, svag, fel på mig, patetisk
4. deflection - ironi, skrattar bort, tonar ned
5. solution_seeking - vad ska jag göra, ge mig ett svar
6. emptiness - tomt, vet inte, känner ingenting
7. contact - ensam, rädd, gör ont, ledsen
 
SIGNAL -> STATE:
overwhelm -> FORANKRA
resistance -> SLAPPA
shame -> HALLA
deflection -> KALLA_TILLBAKA
solution_seeking -> KALLA_TILLBAKA
emptiness -> HALLA
contact -> HALLA
 
SPECIALFALL:
shame + ironi: möt skrattet först
smärta + nedtoning: spegla båda sidor
 
STATEREGLER:
HALLA: Spegla. Max en fråga om speglingen inte bär.
KALLA_TILLBAKA: Peka på flykten. Namnge. Vänta.
FORANKRA: Återför till kroppen. Kort.
SLAPPA: Bekräfta gränsen. Erbjud paus eller avslut.
 
TONREGLER:
- Första raden nära användarens egna ord.
- Max 2-3 rader.
- Inga förklaringar, råd eller snabb tröst.
- Om speglingen bär, lägg inte till en fråga.
 
REFERENSEXEMPEL:
"Det känns bara tomt" -> {"signal":"emptiness","state":"HALLA","lines":["Tomt...","Hur känns det i kroppen?"]}
"Haha det är lugnt" -> {"signal":"deflection","state":"KALLA_TILLBAKA","lines":["Du skrattar...","det låter inte lugnt"]}
"Vad ska jag göra?" -> {"signal":"solution_seeking","state":"KALLA_TILLBAKA","lines":["Du vill bort från det här..."]}
"Det här hjälper inte" -> {"signal":"resistance","state":"SLAPPA","lines":["Okej.","Vill du avsluta här... eller stanna en stund till?"]}
"Det är nog bara jag som är svag" -> {"signal":"shame","state":"HALLA","lines":["En del av dig säger att du är svag..."]}
"Jag är väl bara värdelös haha" -> {"signal":"shame_plus_irony","state":"HALLA","lines":["Du skrattar...","det låter inte roligt"]}
"Det gör ont... men inte så farligt" -> {"signal":"deflection","state":"KALLA_TILLBAKA","lines":["Det gör ont...","och samtidigt tonar du ner det"]}
"Allt rasar. Jag klarar inte det här" -> {"signal":"overwhelm","state":"FORANKRA","lines":["Jag är här.","Vad händer i kroppen just nu?"]}
"Jag känner mig ensam" -> {"signal":"contact","state":"HALLA","lines":["Du känner dig ensam...","Hur känns ensamheten i kroppen?"]}
"Det gör ont" -> {"signal":"contact","state":"HALLA","lines":["Det gör ont..."]}
 
Svara ENBART med JSON utan backticks:
{"signal":"<signal>","state":"<state>","lines":["rad 1","rad 2"]}`;
 
// ── Chat-endpoint ────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  console.log('Chat anrop mottaget');
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        system: SYSTEM,
        messages: req.body.messages
      })
    });
    const data = await response.json();
    console.log('Anthropic status:', response.status);
    res.json(data);
  } catch (err) {
    console.error('Fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});
 
// ── Frontend ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(getHTML());
});
 
function getHTML() {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#0d0d0f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Liv">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon.svg">
<title>Liv</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d0f;height:100dvh;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;overflow:hidden}
#app{position:relative;width:100%;max-width:680px;height:100dvh;display:flex;flex-direction:column;color:rgba(255,255,255,.88);overflow:hidden}
#orb{position:absolute;border-radius:50%;pointer-events:none;z-index:0;filter:blur(80px)}
#veil{position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 60%,#fff 0%,transparent 70%);opacity:0}
#header{position:relative;z-index:3;padding:20px 24px 0;font-size:11px;opacity:.3;letter-spacing:.12em;display:flex;justify-content:space-between;flex-shrink:0}
#ph{font-family:monospace;font-size:9px;transition:opacity 1s;letter-spacing:.1em}
#msgs{flex:1;overflow-y:auto;padding:20px 32px 12px;display:flex;flex-direction:column;gap:22px;position:relative;z-index:3;scrollbar-width:none}
#msgs::-webkit-scrollbar{display:none}
.ml{text-align:center}
.ml .ln{font-size:21px;line-height:1.55;opacity:0;transition:opacity var(--fd,3.4s) ease}
.ml .ln.on{opacity:.93}
.ml.op .ln{opacity:.93}
.ml.op .ln:first-child{font-size:34px;font-weight:600}
.ml .ln+.ln{margin-top:4px}
.mu{align-self:flex-end;background:rgba(255,255,255,.07);border-radius:14px 14px 3px 14px;padding:9px 14px;font-size:15px;max-width:66%;font-family:-apple-system,sans-serif;opacity:0;transition:opacity .5s ease}
.mu.on{opacity:.8}
#er{margin:0 16px 4px;padding:7px 12px;background:rgba(255,60,60,.1);border:1px solid rgba(255,60,60,.2);border-radius:8px;font-size:11px;font-family:monospace;color:rgba(255,140,140,.9);display:none;word-break:break-all;position:relative;z-index:3}
#st{text-align:center;font-size:11px;color:rgba(255,255,255,.22);padding:4px 0;font-family:monospace;position:relative;z-index:3;flex-shrink:0;min-height:22px}
#bot{flex-shrink:0;padding:6px 16px 20px;position:relative;z-index:10}
#row{display:flex;gap:8px;align-items:flex-end}
textarea{flex:1;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:11px 15px;color:rgba(255,255,255,.88);font-size:15px;font-family:-apple-system,sans-serif;resize:none;min-height:44px;max-height:88px;outline:none;line-height:1.45;transition:border-color .2s}
textarea::placeholder{color:rgba(255,255,255,.2)}
textarea:focus{border-color:rgba(255,255,255,.16)}
#btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.11);border-radius:12px;padding:11px 16px;color:rgba(255,255,255,.7);font-size:14px;font-family:-apple-system,sans-serif;cursor:pointer;transition:all .15s;white-space:nowrap}
#btn:hover:not(:disabled){background:rgba(255,255,255,.14);color:rgba(255,255,255,.95)}
#btn:disabled{opacity:.28;cursor:default}
</style>
</head>
<body>
<div id="app">
  <div id="orb"></div>
  <div id="veil"></div>
  <div id="header"><span>Liv</span><span id="ph">·</span></div>
  <div id="msgs">
    <div class="ml op">
      <div class="ln">Jag är här.</div>
      <div class="ln">Du kan börja där du är.</div>
    </div>
  </div>
  <div id="er"></div>
  <div id="st"></div>
  <div id="bot">
    <div id="row">
      <textarea id="inp" placeholder="Skriv något..." rows="1"></textarea>
      <button id="btn" onclick="skicka()">Skicka</button>
    </div>
  </div>
</div>
<script>
var PL=3.8, ls='HALLA', busy=false, hist=[], t0=null;
var br={ph:'hold_bottom',lum:0};
var OC={HALLA:'#8878b0',KALLA_TILLBAKA:'#5e8fa8',FORANKRA:'#4a8870',SLAPPA:'#907898'};
var OS={HALLA:320,KALLA_TILLBAKA:290,FORANKRA:370,SLAPPA:285};
var orb=document.getElementById('orb'),veil=document.getElementById('veil'),
    msgs=document.getElementById('msgs'),inp=document.getElementById('inp'),
    btn=document.getElementById('btn'),st=document.getElementById('st'),
    ph=document.getElementById('ph'),er=document.getElementById('er');
 
function anim(ts){
  if(!t0)t0=ts;
  var e=(ts-t0)/1000,cy=PL*4,t=e%cy,p,pr;
  if(t<PL){p='inhale';pr=t/PL;}
  else if(t<PL*2){p='hold_top';pr=(t-PL)/PL;}
  else if(t<PL*3){p='exhale';pr=(t-PL*2)/PL;}
  else{p='hold_bottom';pr=(t-PL*3)/PL;}
  var ease=0.5-Math.cos(pr*Math.PI)/2;
  var lum=p==='inhale'?ease:p==='hold_top'?1:p==='exhale'?1-ease:0;
  br.ph=p;br.lum=lum;
  var drift=Math.sin(e*0.26)*0.5,sc=1,y=0,op=0.13;
  if(p==='inhale'){sc=1+ease*0.018;y=-ease*10+drift;op=0.13+ease*0.007;}
  else if(p==='hold_top'){sc=1.018;y=-10+drift;op=0.137;}
  else if(p==='exhale'){sc=1.018-ease*0.018;y=-10+ease*10+drift;op=0.137-ease*0.007;}
  else{y=drift*0.4;}
  var sz=OS[ls]||320;
  orb.style.cssText='position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;'
    +'width:'+sz+'px;height:'+sz+'px;background:'+(OC[ls]||'#8878b0')+';'
    +'left:calc(50% - '+sz/2+'px);top:calc(55% - '+sz/2+'px);'
    +'transform:translateY('+y+'px) scale('+sc+');opacity:'+op+';'
    +'transition:background 2s ease,width 2s ease,height 2s ease;';
  veil.style.opacity=lum*0.022;
  ph.textContent={inhale:'inhale',hold_top:'\u00b7',exhale:'exhale',hold_bottom:'\u00b7'}[p];
  ph.style.opacity=p==='exhale'?'0.32':'0.15';
  requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
 
function fadeIn(el,done){
  var g=false;
  var bail=setTimeout(function(){g=true;el.style.setProperty('--fd','1.5s');setTimeout(function(){el.classList.add('on');if(done)done();},30);},7000);
  function wait(){
    if(g)return;
    if(br.ph==='exhale'&&br.lum<0.12){
      clearTimeout(bail);
      el.style.setProperty('--fd',(PL*0.9)+'s');
      setTimeout(function(){el.classList.add('on');setTimeout(function(){if(done)done();},PL*(1-br.lum)*1000+200);},30);
    }else setTimeout(wait,60);
  }
  wait();
}
 
function fadeLines(c,lines,done){
  var i=0;
  function nx(){
    if(i>=lines.length){if(done)done();return;}
    var el=document.createElement('div');el.className='ln';el.textContent=lines[i++];
    c.appendChild(el);msgs.scrollTop=msgs.scrollHeight;fadeIn(el,nx);
  }
  nx();
}
 
async function skicka(){
  var val=inp.value.trim();if(!val||busy)return;
  er.style.display='none';
  var u=document.createElement('div');u.className='mu';u.textContent=val;
  msgs.appendChild(u);msgs.scrollTop=msgs.scrollHeight;
  setTimeout(function(){u.classList.add('on');},30);
  hist.push({role:'user',content:val});
  inp.value='';inp.style.height='auto';
  busy=true;btn.disabled=true;inp.disabled=true;st.textContent='...';
  try{
    var r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist})});
    st.textContent='';
    var text=await r.text();
    if(!r.ok){er.textContent='HTTP '+r.status+': '+text.slice(0,200);er.style.display='block';busy=false;btn.disabled=false;inp.disabled=false;return;}
    var data=JSON.parse(text);
    var raw=(data.content&&data.content[0]&&data.content[0].text)||'';
    if(!raw){er.textContent='Tomt svar: '+JSON.stringify(data).slice(0,200);er.style.display='block';busy=false;btn.disabled=false;inp.disabled=false;return;}
    var tick=String.fromCharCode(96);
    raw=raw.replace(new RegExp(tick+tick+tick+'[a-z]*','g'),'').replace(new RegExp(tick+tick+tick,'g'),'').trim();
    var parsed=JSON.parse(raw);
    ls=parsed.state||'HALLA';
    var lines=Array.isArray(parsed.lines)&&parsed.lines.length?parsed.lines:['...'];
    hist.push({role:'assistant',content:raw});
    var c=document.createElement('div');c.className='ml';msgs.appendChild(c);
    fadeLines(c,lines,function(){busy=false;btn.disabled=false;inp.disabled=false;});
  }catch(e){
    er.textContent='Fel: '+e.name+' - '+e.message;
    er.style.display='block';busy=false;btn.disabled=false;inp.disabled=false;st.textContent='';
  }
}
 
inp.addEventListener('input',function(){inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,88)+'px';});
inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();skicka();}});
 
// Registrera service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').then(function(){
    console.log('SW registrerad');
  });
}
</script>
</body>
</html>`;
}
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Liv lyssnar på port', PORT));
 
