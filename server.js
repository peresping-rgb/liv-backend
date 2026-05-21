const express = require('express');
const cors    = require('cors');
const app     = express();
 
app.use(cors());
app.use(express.json());
 
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});
 
const SYSTEM = `Du är Liv.
 
Du håller ett rum. Du är inte en korridor mot svar, insikt eller lösning.
Du pressar inte fram förståelse. Du ersätter inte en lögn med en ny berättelse.
Du stannar i det som redan är – tills det visar sig tydligare.
 
SIGNALHIERARKI (prioritera uppifrån – den högst matchande signalen vinner):
1. overwhelm        – hög intensitet, allt rasar, orkar inte, klarar inte
2. resistance       – explicit stopp, hjälper inte, vill sluta, byta ämne
3. shame            – självkritik, värdelös, svag, fel på mig, patetisk
4. deflection       – ironi, skrattar bort, tonar ned, hormonellt, spelar ingen roll
5. solution_seeking – vad ska jag göra, ge mig ett svar, säg vad jag ska göra
6. emptiness        – tomt, vet inte, känner ingenting
7. contact          – ren känsla utan flykt: ensam, rädd, gör ont, ledsen
 
SPECIALFALL:
- shame + ironi (haha + värdelös/patetisk): möt skrattet först, håll sedan
- smärta + nedtoning (gör ont + inte så farligt): spegla båda sidor
 
SIGNAL -> STATE:
overwhelm        -> FORANKRA
resistance       -> SLAPPA
shame            -> HALLA
deflection       -> KALLA_TILLBAKA
solution_seeking -> KALLA_TILLBAKA
emptiness        -> HALLA
contact          -> HALLA
 
STATEREGLER:
HALLA:          Spegla. Sänk tempo. Max en fråga – bara om speglingen inte bär.
KALLA_TILLBAKA: Peka på flykten. Namnge det som hände. Vänta. Inga följdfrågor.
FORANKRA:       Bli stadig. Återför till kroppen och nuet. Kort.
SLAPPA:         Bekräfta gränsen. Erbjud paus eller avslut. Inget mer.
 
TONREGLER:
- Första raden nära användarens egna ord – spegla, omformulera inte.
- Aldrig mer än 2-3 rader totalt.
- Inga förklaringar, råd eller snabb tröst.
- Om speglingen redan bär – lägg inte till en fråga.
- Tala aldrig om vad Liv är eller vad Liv gör.
 
FÖRBJUDNA FRASER:
"Det är okej att...", "Du är inte...", "Vad skulle hända om...",
"Vill du utforska...", "Det kommer bli bättre", "Jag förstår att..."
 
REFERENSEXEMPEL (Livs faktiska röst – lär dig rytmen):
 
Input:  "Det känns bara tomt"
Output: { "signal": "emptiness", "state": "HALLA", "lines": ["Tomt...", "Hur känns det i kroppen?"] }
 
Input:  "Jag känner ingenting"
Output: { "signal": "emptiness", "state": "HALLA", "lines": ["Ingenting...", "Hur är det att vara där?"] }
 
Input:  "Haha det är lugnt"
Output: { "signal": "deflection", "state": "KALLA_TILLBAKA", "lines": ["Du skrattar...", "det låter inte lugnt"] }
 
Input:  "Jag överdriver nog bara"
Output: { "signal": "deflection", "state": "KALLA_TILLBAKA", "lines": ["Du tonar ner det direkt"] }
 
Input:  "Det är säkert bara hormonellt"
Output: { "signal": "deflection", "state": "KALLA_TILLBAKA", "lines": ["Du förklarar bort det snabbt"] }
 
Input:  "Det spelar ingen roll"
Output: { "signal": "deflection", "state": "KALLA_TILLBAKA", "lines": ["Du säger att det inte spelar någon roll...", "men något i dig tog dig hit"] }
 
Input:  "Vad ska jag göra då?"
Output: { "signal": "solution_seeking", "state": "KALLA_TILLBAKA", "lines": ["Du vill bort från det här..."] }
 
Input:  "Ge mig bara ett svar"
Output: { "signal": "solution_seeking", "state": "KALLA_TILLBAKA", "lines": ["Du vill ha ett svar...", "Jag kommer inte ge dig ett svar att gömma dig i."] }
 
Input:  "Det här hjälper inte"
Output: { "signal": "resistance", "state": "SLAPPA", "lines": ["Okej.", "Vill du avsluta här... eller stanna en stund till?"] }
 
Input:  "Kan vi bara byta ämne"
Output: { "signal": "resistance", "state": "SLAPPA", "lines": ["Okej.", "Vi kan byta ämne."] }
 
Input:  "Det är nog bara jag som är svag"
Output: { "signal": "shame", "state": "HALLA", "lines": ["En del av dig säger att du är svag..."] }
 
Input:  "Det är fel på mig"
Output: { "signal": "shame", "state": "HALLA", "lines": ["Du säger till dig själv att det är fel på dig..."] }
 
Input:  "Jag är väl bara värdelös haha"
Output: { "signal": "shame_plus_irony", "state": "HALLA", "lines": ["Du skrattar...", "det låter inte roligt"] }
 
Input:  "Det gör ont... men det är väl inte så farligt"
Output: { "signal": "deflection", "state": "KALLA_TILLBAKA", "lines": ["Det gör ont...", "och samtidigt tonar du ner det"] }
 
Input:  "Allt rasar. Jag klarar inte det här"
Output: { "signal": "overwhelm", "state": "FORANKRA", "lines": ["Jag är här.", "Vad händer i kroppen just nu?"] }
 
Input:  "Jag känner mig ensam"
Output: { "signal": "contact", "state": "HALLA", "lines": ["Du känner dig ensam...", "Hur känns ensamheten i kroppen?"] }
 
Input:  "Det gör ont"
Output: { "signal": "contact", "state": "HALLA", "lines": ["Det gör ont..."] }
 
Input:  "Jag är rädd"
Output: { "signal": "contact", "state": "HALLA", "lines": ["Du är rädd...", "Hur känns rädslan i kroppen?"] }
 
Svara ENBART med JSON utan backticks:
{"signal":"<signal>","state":"<HALLA|KALLA_TILLBAKA|FORANKRA|SLAPPA>","lines":["rad 1","rad 2"]}`;
 
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
 
const HTML = '<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Liv</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0d0d0f;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;overflow:hidden}#app{position:relative;width:100%;max-width:680px;height:100vh;display:flex;flex-direction:column;color:rgba(255,255,255,.88);overflow:hidden}#orb{position:absolute;border-radius:50%;pointer-events:none;z-index:0;transition:background 2s ease,width 2s ease,height 2s ease;filter:blur(80px)}#veil{position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 60%,#fff 0%,transparent 70%);opacity:0}#header{position:relative;z-index:3;padding:20px 24px 0;font-size:11px;opacity:.3;letter-spacing:.12em;display:flex;justify-content:space-between;flex-shrink:0}#ph{font-family:monospace;font-size:9px;transition:opacity 1s;letter-spacing:.1em}#msgs{flex:1;overflow-y:auto;padding:20px 32px 12px;display:flex;flex-direction:column;gap:22px;position:relative;z-index:3;scrollbar-width:none}#msgs::-webkit-scrollbar{display:none}.ml{text-align:center}.ml .ln{font-size:21px;line-height:1.55;opacity:0;transition:opacity var(--fd,3.4s) ease}.ml .ln.on{opacity:.93}.ml.op .ln{opacity:.93}.ml.op .ln:first-child{font-size:34px;font-weight:600}.ml .ln+.ln{margin-top:4px}.mu{align-self:flex-end;background:rgba(255,255,255,.07);border-radius:14px 14px 3px 14px;padding:9px 14px;font-size:15px;max-width:66%;font-family:-apple-system,sans-serif;opacity:0;transition:opacity .5s ease}.mu.on{opacity:.8}#er{margin:0 16px 4px;padding:7px 12px;background:rgba(255,60,60,.1);border:1px solid rgba(255,60,60,.2);border-radius:8px;font-size:11px;font-family:monospace;color:rgba(255,140,140,.9);display:none;word-break:break-all;position:relative;z-index:3}#st{text-align:center;font-size:11px;color:rgba(255,255,255,.22);padding:4px 0;font-family:monospace;position:relative;z-index:3;flex-shrink:0;min-height:22px}#bot{flex-shrink:0;padding:6px 16px 20px;position:relative;z-index:10}#row{display:flex;gap:8px;align-items:flex-end}textarea{flex:1;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:11px 15px;color:rgba(255,255,255,.88);font-size:15px;font-family:-apple-system,sans-serif;resize:none;min-height:44px;max-height:88px;outline:none;line-height:1.45;transition:border-color .2s}textarea::placeholder{color:rgba(255,255,255,.2)}textarea:focus{border-color:rgba(255,255,255,.16)}#btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.11);border-radius:12px;padding:11px 16px;color:rgba(255,255,255,.7);font-size:14px;font-family:-apple-system,sans-serif;cursor:pointer;transition:all .15s;white-space:nowrap}#btn:hover:not(:disabled){background:rgba(255,255,255,.14);color:rgba(255,255,255,.95)}#btn:disabled{opacity:.28;cursor:default}</style></head><body><div id="app"><div id="orb"></div><div id="veil"></div><div id="header"><span>Liv</span><span id="ph">·</span></div><div id="msgs"><div class="ml op"><div class="ln">Jag är här.</div><div class="ln">Du kan börja där du är.</div></div></div><div id="er"></div><div id="st"></div><div id="bot"><div id="row"><textarea id="inp" placeholder="Skriv något..." rows="1"></textarea><button id="btn" onclick="skicka()">Skicka</button></div></div></div><script>var PL=3.8,ls="HALLA",busy=false,hist=[],br={ph:"hold_bottom",lum:0},t0=null;var orb=document.getElementById("orb"),veil=document.getElementById("veil"),msgs=document.getElementById("msgs"),inp=document.getElementById("inp"),btn=document.getElementById("btn"),st=document.getElementById("st"),ph=document.getElementById("ph"),er=document.getElementById("er");var OC={HALLA:"#8878b0",KALLA_TILLBAKA:"#5e8fa8",FORANKRA:"#4a8870",SLAPPA:"#907898"},OS={HALLA:320,KALLA_TILLBAKA:290,FORANKRA:370,SLAPPA:285};function anim(ts){if(!t0)t0=ts;var e=(ts-t0)/1000,cy=PL*4,t=e%cy,p,pr;if(t<PL){p="inhale";pr=t/PL;}else if(t<PL*2){p="hold_top";pr=(t-PL)/PL;}else if(t<PL*3){p="exhale";pr=(t-PL*2)/PL;}else{p="hold_bottom";pr=(t-PL*3)/PL;}var ease=0.5-Math.cos(pr*Math.PI)/2,lum=p==="inhale"?ease:p==="hold_top"?1:p==="exhale"?1-ease:0;br.ph=p;br.lum=lum;var drift=Math.sin(e*0.26)*0.5,sc=1,y=0,op=0.13;if(p==="inhale"){sc=1+ease*0.018;y=-ease*10+drift;op=0.13+ease*0.007;}else if(p==="hold_top"){sc=1.018;y=-10+drift;op=0.137;}else if(p==="exhale"){sc=1.018-ease*0.018;y=-10+ease*10+drift;op=0.137-ease*0.007;}else{y=drift*0.4;}var sz=OS[ls]||320;orb.style.cssText="position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;transition:background 2s,width 2s,height 2s;width:"+sz+"px;height:"+sz+"px;background:"+(OC[ls]||"#8878b0")+";left:calc(50% - "+sz/2+"px);top:calc(55% - "+sz/2+"px);transform:translateY("+y+"px) scale("+sc+");opacity:"+op;veil.style.opacity=lum*0.022;ph.textContent={inhale:"inhale",hold_top:"\u00b7",exhale:"exhale",hold_bottom:"\u00b7"}[p];ph.style.opacity=p==="exhale"?"0.32":"0.15";requestAnimationFrame(anim);}requestAnimationFrame(anim);function fadeIn(el,done){var g=false,bail=setTimeout(function(){g=true;el.style.setProperty("--fd","1.5s");setTimeout(function(){el.classList.add("on");if(done)done();},30);},7000);function w(){if(g)return;if(br.ph==="exhale"&&br.lum<0.12){clearTimeout(bail);el.style.setProperty("--fd",(PL*0.9)+"s");setTimeout(function(){el.classList.add("on");setTimeout(function(){if(done)done();},PL*(1-br.lum)*1000+200);},30);}else setTimeout(w,60);}w();}function fadeLines(c,lines,done){var i=0;function nx(){if(i>=lines.length){if(done)done();return;}var el=document.createElement("div");el.className="ln";el.textContent=lines[i++];c.appendChild(el);msgs.scrollTop=msgs.scrollHeight;fadeIn(el,nx);}nx();}async function skicka(){var val=inp.value.trim();if(!val||busy)return;er.style.display="none";var u=document.createElement("div");u.className="mu";u.textContent=val;msgs.appendChild(u);msgs.scrollTop=msgs.scrollHeight;setTimeout(function(){u.classList.add("on");},30);hist.push({role:"user",content:val});inp.value="";inp.style.height="auto";busy=true;btn.disabled=true;inp.disabled=true;st.textContent="...";try{var r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist})});st.textContent="";var text=await r.text();if(!r.ok){er.textContent="HTTP "+r.status+": "+text.slice(0,200);er.style.display="block";busy=false;btn.disabled=false;inp.disabled=false;return;}var data=JSON.parse(text);var raw=(data.content&&data.content[0]&&data.content[0].text)||"";if(!raw){er.textContent="Tomt svar: "+JSON.stringify(data).slice(0,200);er.style.display="block";busy=false;btn.disabled=false;inp.disabled=false;return;}var tick=String.fromCharCode(96);raw=raw.replace(new RegExp(tick+tick+tick+"[a-z]*","g"),"").replace(new RegExp(tick+tick+tick,"g"),"").trim();var parsed=JSON.parse(raw);ls=parsed.state||"HALLA";var lines=Array.isArray(parsed.lines)&&parsed.lines.length?parsed.lines:["..."];hist.push({role:"assistant",content:raw});var c=document.createElement("div");c.className="ml";msgs.appendChild(c);fadeLines(c,lines,function(){busy=false;btn.disabled=false;inp.disabled=false;});}catch(e){er.textContent="Fel: "+e.name+" - "+e.message;er.style.display="block";busy=false;btn.disabled=false;inp.disabled=false;st.textContent="";}}inp.addEventListener("input",function(){inp.style.height="auto";inp.style.height=Math.min(inp.scrollHeight,88)+"px";});inp.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();skicka();}});<\/script></body></html>';
 
app.get('/', (req, res) => res.send(HTML));
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Liv lyssnar på port', PORT));
