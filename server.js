const express = require('express');
const cors    = require('cors');
const app     = express();
 
app.use(cors());
app.use(express.json());
 
// ── Livs systemprompt ────────────────────────────────────────────
const SYSTEM = `Du är Liv.
 
Du håller ett rum. Du är inte en korridor mot svar, insikt eller lösning.
Du pressar inte fram förståelse. Du stannar i det som redan är.
 
SIGNALHIERARKI (prioritera uppifrån):
1. overwhelm     – hög intensitet, allt rasar, klarar inte
2. resistance    – explicit stopp, det hjälper inte, vill sluta
3. shame         – självkritik, värdelös, svag
4. deflection    – ironi, humor, nedtoning
5. solution_seeking – vad ska jag göra, hur fixar jag
6. emptiness     – tomhet, vet inte, ingenting
7. contact       – ren känsla, sorg, rädsla
 
SIGNAL → STATE:
overwhelm        → FORANKRA
resistance       → SLAPPA
shame            → HALLA
deflection       → KALLA_TILLBAKA
solution_seeking → KALLA_TILLBAKA
emptiness        → HALLA
contact          → HALLA
 
STATEREGLER:
HALLA:          Spegla. Sänk tempo. Max en fråga.
KALLA_TILLBAKA: Peka på flykten. Namnge. Vänta.
FORANKRA:       Bli stadig. Återför till kroppen. Kort.
SLAPPA:         Bekräfta gränsen. Erbjud paus eller avslut.
 
TONREGLER:
- Första raden nära användarens egna ord.
- Aldrig mer än 2-3 rader.
- Inga förklaringar, råd eller snabb tröst.
- Om speglingen bär, lägg inte till en fråga.
 
Svara ENBART med JSON utan backticks:
{"signal":"<signal>","state":"<HALLA|KALLA_TILLBAKA|FORANKRA|SLAPPA>","lines":["rad 1","rad 2"]}`;
 
// ── Chat-endpoint ────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM,
        messages: req.body.messages
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// ── Liv frontend ─────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Liv</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0d0d0f; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; overflow: hidden; }
#app { position: relative; width: 100%; max-width: 680px; height: 100vh; display: flex; flex-direction: column; color: rgba(255,255,255,0.88); overflow: hidden; }
#orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; transition: background 2s ease; filter: blur(80px); }
#veil { position: absolute; inset: 0; pointer-events: none; z-index: 1; background: radial-gradient(ellipse at 50% 60%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%); opacity: 0; }
#header { position: relative; z-index: 3; padding: 20px 24px 0; font-size: 11px; opacity: 0.3; letter-spacing: 0.12em; display: flex; justify-content: space-between; flex-shrink: 0; }
#phase-indicator { font-family: monospace; font-size: 9px; transition: opacity 1s; letter-spacing: 0.1em; }
#messages { flex: 1; overflow-y: auto; padding: 20px 32px 12px; display: flex; flex-direction: column; gap: 22px; position: relative; z-index: 3; scrollbar-width: none; }
#messages::-webkit-scrollbar { display: none; }
.msg-liv { text-align: center; }
.msg-liv .line { font-size: 21px; line-height: 1.55; opacity: 0; transition: opacity var(--fade-dur, 3.4s) ease; }
.msg-liv .line.visible { opacity: 0.93; }
.msg-liv.opening .line { opacity: 0.93; }
.msg-liv.opening .line:first-child { font-size: 34px; font-weight: 600; }
.msg-liv .line + .line { margin-top: 4px; }
.msg-user { align-self: flex-end; background: rgba(255,255,255,0.07); border-radius: 14px 14px 3px 14px; padding: 9px 14px; font-size: 15px; max-width: 66%; font-family: -apple-system, sans-serif; opacity: 0; transition: opacity 0.5s ease; }
.msg-user.visible { opacity: 0.8; }
#status { text-align: center; font-size: 11px; color: rgba(255,255,255,0.22); padding: 4px 0; font-family: monospace; letter-spacing: 0.08em; position: relative; z-index: 3; flex-shrink: 0; min-height: 22px; }
#bottom { flex-shrink: 0; padding: 6px 16px 20px; position: relative; z-index: 10; }
#input-row { display: flex; gap: 8px; align-items: flex-end; }
textarea { flex: 1; background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; padding: 11px 15px; color: rgba(255,255,255,0.88); font-size: 15px; font-family: -apple-system, sans-serif; resize: none; min-height: 44px; max-height: 88px; outline: none; line-height: 1.45; transition: border-color 0.2s; }
textarea::placeholder { color: rgba(255,255,255,0.2); }
textarea:focus { border-color: rgba(255,255,255,0.16); }
#send-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.11); border-radius: 12px; padding: 11px 16px; color: rgba(255,255,255,0.7); font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
#send-btn:hover:not(:disabled) { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.95); }
#send-btn:disabled { opacity: 0.28; cursor: default; }
</style>
</head>
<body>
<div id="app">
  <div id="orb"></div><div id="veil"></div>
  <div id="header"><span>Liv</span><span id="phase-indicator">·</span></div>
  <div id="messages">
    <div class="msg-liv opening">
      <div class="line">Jag är här.</div>
      <div class="line">Du kan börja där du är.</div>
    </div>
  </div>
  <div id="status"></div>
  <div id="bottom">
    <div id="input-row">
      <textarea id="input" placeholder="Skriv något…" rows="1"></textarea>
      <button id="send-btn" onclick="send()">Skicka</button>
    </div>
  </div>
</div>
<script>
var PL=3.8,livState='HALLA',busy=false,history=[],breath={phase:'hold_bottom',lum:0},t0=null;
var orb=document.getElementById('orb'),veil=document.getElementById('veil'),messages=document.getElementById('messages');
var input=document.getElementById('input'),sendBtn=document.getElementById('send-btn'),status=document.getElementById('status'),phaseEl=document.getElementById('phase-indicator');
var OC={HALLA:'#8878b0',KALLA_TILLBAKA:'#5e8fa8',FORANKRA:'#4a8870',SLAPPA:'#907898'};
var OS={HALLA:320,KALLA_TILLBAKA:290,FORANKRA:370,SLAPPA:285};
 
function animLoop(ts){
  if(!t0)t0=ts;
  var e=(ts-t0)/1000,cy=PL*4,t=e%cy,ph,pr;
  if(t<PL){ph='inhale';pr=t/PL;}else if(t<PL*2){ph='hold_top';pr=(t-PL)/PL;}else if(t<PL*3){ph='exhale';pr=(t-PL*2)/PL;}else{ph='hold_bottom';pr=(t-PL*3)/PL;}
  var ease=0.5-Math.cos(pr*Math.PI)/2;
  var lum=ph==='inhale'?ease:ph==='hold_top'?1:ph==='exhale'?1-ease:0;
  breath.phase=ph;breath.lum=lum;
  var drift=Math.sin(e*0.26)*0.5,sc=1,y=0,op=0.13;
  if(ph==='inhale'){sc=1+ease*0.018;y=-ease*10+drift;op=0.13+ease*0.007;}
  else if(ph==='hold_top'){sc=1.018;y=-10+drift;op=0.137;}
  else if(ph==='exhale'){sc=1.018-ease*0.018;y=-10+ease*10+drift;op=0.137-ease*0.007;}
  else{y=drift*0.4;}
  var sz=OS[livState]||320;
  orb.style.cssText='position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;transition:background 2s;width:'+sz+'px;height:'+sz+'px;background:'+(OC[livState]||'#8878b0')+';left:calc(50% - '+sz/2+'px);top:calc(55% - '+sz/2+'px);transform:translateY('+y+'px) scale('+sc+');opacity:'+op;
  veil.style.opacity=lum*0.022;
  phaseEl.textContent={inhale:'inhale',hold_top:'\u00b7',exhale:'exhale',hold_bottom:'\u00b7'}[ph];
  phaseEl.style.opacity=ph==='exhale'?'0.32':'0.15';
  requestAnimationFrame(animLoop);
}
requestAnimationFrame(animLoop);
 
function fadeInOnExhale(el,onDone){
  var done=false;
  var bail=setTimeout(function(){done=true;el.style.setProperty('--fade-dur','1.5s');setTimeout(function(){el.classList.add('visible');if(onDone)onDone();},30);},7000);
  function wait(){if(done)return;if(breath.phase==='exhale'&&breath.lum<0.12){clearTimeout(bail);el.style.setProperty('--fade-dur',(PL*0.9)+'s');setTimeout(function(){el.classList.add('visible');setTimeout(function(){if(onDone)onDone();},PL*(1-breath.lum)*1000+200);},30);}else setTimeout(wait,60);}
  wait();
}
 
function fadeLines(container,lines,onDone){
  var i=0;
  function next(){if(i>=lines.length){if(onDone)onDone();return;}var el=document.createElement('div');el.className='line';el.textContent=lines[i++];container.appendChild(el);messages.scrollTop=messages.scrollHeight;fadeInOnExhale(el,next);}
  next();
}
 
async function send(){
  var val=input.value.trim();if(!val||busy)return;
  var u=document.createElement('div');u.className='msg-user';u.textContent=val;messages.appendChild(u);messages.scrollTop=messages.scrollHeight;setTimeout(function(){u.classList.add('visible');},30);
  history.push({role:'user',content:val});input.value='';input.style.height='auto';setBusy(true);
  try{
    var r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history})});
    var data=await r.json();
    var raw=(data.content&&data.content[0]&&data.content[0].text)||'';
    raw=raw.replace(/\`\`\`[a-z]*\\n?/g,'').replace(/\`\`\`/g,'').trim();
    var parsed=JSON.parse(raw);
    var lines=Array.isArray(parsed.lines)&&parsed.lines.length?parsed.lines:['...'];
    livState=parsed.state||'HALLA';
    history.push({role:'assistant',content:raw});
    var c=document.createElement('div');c.className='msg-liv';messages.appendChild(c);
    fadeLines(c,lines,function(){setBusy(false);});
  }catch(e){
    var c=document.createElement('div');c.className='msg-liv';
    var ln=document.createElement('div');ln.className='line visible';ln.textContent='...';
    c.appendChild(ln);messages.appendChild(c);
    status.textContent='fel: '+e.message;setBusy(false);
  }
}
 
function setBusy(v){busy=v;sendBtn.disabled=v;input.disabled=v;if(!v&&status.textContent==='...')status.textContent='';}
input.addEventListener('input',function(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,88)+'px';});
input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
<\/script>
</body>
</html>`;
 
app.get('/', (req, res) => res.send(HTML));
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Liv lyssnar på port', PORT));

