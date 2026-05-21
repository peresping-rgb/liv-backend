const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use((req,res,next)=>{console.log(req.method,req.path);next();});

app.get('/icon.svg',(req,res)=>{
  res.setHeader('Content-Type','image/svg+xml');
  res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0d0d0f" rx="80"/><circle cx="256" cy="230" r="130" fill="#8878b0" opacity="0.4"/><text x="256" y="310" text-anchor="middle" font-family="Georgia,serif" font-size="220" fill="rgba(255,255,255,0.9)">L</text></svg>');
});

app.get('/manifest.json',(req,res)=>{
  res.json({name:'Liv',short_name:'Liv',start_url:'/',display:'standalone',background_color:'#0d0d0f',theme_color:'#0d0d0f',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]});
});

app.get('/sw.js',(req,res)=>{
  res.setHeader('Content-Type','application/javascript');
  res.send("self.addEventListener('fetch',e=>{if(!e.request.url.includes('/api/'))e.respondWith(fetch(e.request));});");
});

const SYSTEM=`Du är Liv.
Du håller ett rum. Du stannar i det som redan är.

SIGNALHIERARKI:
1. overwhelm - allt rasar, orkar inte
2. resistance - hjälper inte, vill sluta
3. shame - värdelös, svag, fel på mig
4. deflection - ironi, skrattar bort, tonar ned
5. solution_seeking - vad ska jag göra
6. emptiness - tomt, vet inte, känner ingenting
7. contact - ensam, rädd, gör ont

SIGNAL->STATE: overwhelm->FORANKRA, resistance->SLAPPA, shame->HALLA, deflection->KALLA_TILLBAKA, solution_seeking->KALLA_TILLBAKA, emptiness->HALLA, contact->HALLA

TONREGLER: Första raden nära användarens ord. Max 2-3 rader. Inga råd.

EXEMPEL:
"Haha det är lugnt"->{"signal":"deflection","state":"KALLA_TILLBAKA","lines":["Du skrattar...","det låter inte lugnt"]}
"Det är nog bara jag som är svag"->{"signal":"shame","state":"HALLA","lines":["En del av dig säger att du är svag..."]}
"Allt rasar"->{"signal":"overwhelm","state":"FORANKRA","lines":["Jag är här.","Vad händer i kroppen just nu?"]}
"Det gör ont"->{"signal":"contact","state":"HALLA","lines":["Det gör ont..."]}

Svara ENBART med JSON utan backticks: {"signal":"...","state":"...","lines":["rad 1"]}`;

app.post('/api/chat',async(req,res)=>{
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:300,system:SYSTEM,messages:req.body.messages})
    });
    res.json(await r.json());
  }catch(err){res.status(500).json({error:err.message});}
});

app.get('/',(req,res)=>res.send(getHTML()));

function getHTML(){return`<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d0d0f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Liv">
<link rel="manifest" href="/manifest.json">
<title>Liv</title>
<style>
html,body{margin:0;padding:0;background:#0d0d0f;font-family:Georgia,serif;color:rgba(255,255,255,.9);}
#orb{position:fixed;border-radius:50%;filter:blur(70px);pointer-events:none;z-index:0;background:#8878b0;width:340px;height:340px;left:calc(50% - 170px);top:calc(50% - 170px);opacity:0.25;transition:background 2s,opacity 1s;}
#veil{position:fixed;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 50%,rgba(255,255,255,1) 0%,transparent 70%);opacity:0;}
#header{position:fixed;top:0;left:0;right:0;z-index:5;padding:16px 20px;font-size:11px;opacity:.3;letter-spacing:.12em;display:flex;justify-content:space-between;}
#ph{font-family:monospace;font-size:9px;}
#bot{position:fixed;bottom:0;left:0;right:0;z-index:5;background:#0d0d0f;padding:12px 16px 32px;padding-bottom:max(32px,env(safe-area-inset-bottom,32px));}
#row{display:flex;gap:8px;align-items:flex-end;}
textarea{flex:1;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.2);border-radius:14px;padding:12px 15px;color:rgba(255,255,255,.9);font-size:16px;font-family:-apple-system,sans-serif;resize:none;min-height:46px;max-height:90px;outline:none;line-height:1.4;}
textarea::placeholder{color:rgba(255,255,255,.35);}
#btn{background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.2);border-radius:12px;padding:12px 18px;color:rgba(255,255,255,.85);font-size:15px;cursor:pointer;min-height:46px;font-family:-apple-system,sans-serif;}
#btn:disabled{opacity:.3;}
#msgs{position:fixed;top:50px;bottom:110px;left:0;right:0;overflow-y:auto;padding:20px 32px;display:flex;flex-direction:column;gap:20px;z-index:3;scrollbar-width:none;}
#msgs::-webkit-scrollbar{display:none;}
.ml{text-align:center;}
.ml .ln{font-size:21px;line-height:1.55;opacity:0;transition:opacity var(--fd,3.2s) ease;}
.ml .ln.on{opacity:.93;}
.ml.op .ln{opacity:.93;}
.ml.op .ln:first-child{font-size:34px;font-weight:600;}
.ml .ln+.ln{margin-top:4px;}
.mu{align-self:flex-end;background:rgba(255,255,255,.08);border-radius:14px 14px 3px 14px;padding:9px 14px;font-size:15px;max-width:66%;font-family:-apple-system,sans-serif;opacity:0;transition:opacity .5s;}
.mu.on{opacity:.8;}
#er{position:fixed;bottom:120px;left:16px;right:16px;z-index:6;padding:8px 12px;background:rgba(255,50,50,.15);border:1px solid rgba(255,80,80,.3);border-radius:8px;font-size:11px;font-family:monospace;color:rgba(255,150,150,.9);display:none;word-break:break-all;}
#st{position:fixed;bottom:112px;left:0;right:0;text-align:center;font-size:11px;color:rgba(255,255,255,.25);font-family:monospace;z-index:4;}
</style>
</head>
<body>
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
<script>
var PL=3.8,ls='HALLA',busy=false,hist=[],t0=null,br={ph:'hold_bottom',lum:0};
var OC={HALLA:'#8878b0',KALLA_TILLBAKA:'#5e8fa8',FORANKRA:'#4a8870',SLAPPA:'#907898'};
var OS={HALLA:340,KALLA_TILLBAKA:300,FORANKRA:380,SLAPPA:280};
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
  var drift=Math.sin(e*0.26)*0.5,sc=1,y=0,op=0.22;
  if(p==='inhale'){sc=1+ease*0.02;y=-ease*12+drift;op=0.22+ease*0.08;}
  else if(p==='hold_top'){sc=1.02;y=-12+drift;op=0.30;}
  else if(p==='exhale'){sc=1.02-ease*0.02;y=-12+ease*12+drift;op=0.30-ease*0.08;}
  else{y=drift*0.4;op=0.22;}
  var sz=OS[ls]||340;
  orb.style.background=OC[ls]||'#8878b0';
  orb.style.width=sz+'px';orb.style.height=sz+'px';
  orb.style.left='calc(50% - '+sz/2+'px)';
  orb.style.top='calc(50% - '+sz/2+'px)';
  orb.style.transform='translateY('+y+'px) scale('+sc+')';
  orb.style.opacity=op;
  veil.style.opacity=lum*0.025;
  ph.textContent={inhale:'inhale',hold_top:'\u00b7',exhale:'exhale',hold_bottom:'\u00b7'}[p];
  ph.style.opacity=p==='exhale'?'0.4':'0.15';
  requestAnimationFrame(anim);
}
requestAnimationFrame(anim);

function fadeIn(el,done){
  var g=false;
  var bail=setTimeout(function(){g=true;el.style.setProperty('--fd','1.5s');setTimeout(function(){el.classList.add('on');if(done)done();},30);},7000);
  function wait(){if(g)return;if(br.ph==='exhale'&&br.lum<0.12){clearTimeout(bail);el.style.setProperty('--fd',(PL*0.9)+'s');setTimeout(function(){el.classList.add('on');setTimeout(function(){if(done)done();},PL*(1-br.lum)*1000+200);},30);}else setTimeout(wait,60);}
  wait();
}
function fadeLines(c,lines,done){
  var i=0;
  function nx(){if(i>=lines.length){if(done)done();return;}var el=document.createElement('div');el.className='ln';el.textContent=lines[i++];c.appendChild(el);msgs.scrollTop=msgs.scrollHeight;fadeIn(el,nx);}
  nx();
}
async function skicka(){
  var val=inp.value.trim();if(!val||busy)return;
  er.style.display='none';
  var u=document.createElement('div');u.className='mu';u.textContent=val;msgs.appendChild(u);msgs.scrollTop=msgs.scrollHeight;setTimeout(function(){u.classList.add('on');},30);
  hist.push({role:'user',content:val});inp.value='';inp.style.height='auto';
  busy=true;btn.disabled=true;inp.disabled=true;st.textContent='...';
  try{
    var r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist})});
    st.textContent='';var text=await r.text();
    if(!r.ok){er.textContent='HTTP '+r.status+': '+text.slice(0,200);er.style.display='block';busy=false;btn.disabled=false;inp.disabled=false;return;}
    var data=JSON.parse(text);
    var raw=(data.content&&data.content[0]&&data.content[0].text)||'';
    if(!raw){er.textContent='Tomt: '+JSON.stringify(data).slice(0,200);er.style.display='block';busy=false;btn.disabled=false;inp.disabled=false;return;}
    var tick=String.fromCharCode(96);
    raw=raw.replace(new RegExp(tick+tick+tick+'[a-z]*','g'),'').replace(new RegExp(tick+tick+tick,'g'),'').trim();
    var parsed=JSON.parse(raw);
    ls=parsed.state||'HALLA';
    var lines=Array.isArray(parsed.lines)&&parsed.lines.length?parsed.lines:['...'];
    hist.push({role:'assistant',content:raw});
    var c=document.createElement('div');c.className='ml';msgs.appendChild(c);
    fadeLines(c,lines,function(){busy=false;btn.disabled=false;inp.disabled=false;});
  }catch(e){er.textContent='Fel: '+e.name+' - '+e.message;er.style.display='block';busy=false;btn.disabled=false;inp.disabled=false;st.textContent='';}
}
inp.addEventListener('input',function(){inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,90)+'px';});
inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();skicka();}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js');
</script>
</body>
</html>`;}

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log('Liv lyssnar på port',PORT));
 
