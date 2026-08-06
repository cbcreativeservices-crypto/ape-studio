import json, re, html

SNAP="/sessions/sweet-vigilant-faraday/mnt/.projects/019e233f-f40b-71f1-bb98-7fbb7c468063/docs/ape_glossary_data_snapshot_20260708.js"
COMP="/sessions/sweet-vigilant-faraday/mnt/.claude/projects/C--Users-profe-AppData-Roaming-Claude-local-agent-mode-sessions-78b71b62-0b47-4e9c-839f-0fa0de774b9c-b2b99107-d98c-497e-a9f4-45f503d4effd-local-968aaf80-e48f-495a-90a6-eda21d757da4-outputs/d480c890-19e0-4f1d-975e-c16fb2cb7d54/tool-results/mcp-3275043b-c635-435c-b585-dd4ade415046-execute_sql-1783834931736.txt"
OUT="/sessions/sweet-vigilant-faraday/mnt/AUDIO APP/AP&E_Glossary_Manager.html"

raw=open(SNAP,encoding="utf-8").read(); raw=raw[raw.find("{"):].rstrip().rstrip(";")
gd=json.loads(raw)

craw=open(COMP,encoding="utf-8").read()
res=json.loads(craw)["result"]            # unwrap outer {"result":"..."}
m=re.search(r'\[\{.*\}\]', res, re.S)
tsv=json.loads(m.group(0))[0]['tsv']
comp={}
for line in tsv.split('\n'):
    if not line.strip(): continue
    t,b=line.rsplit('\t',1); comp[t]=int(b)

courses={c['code']:c['name'] for c in gd['courses']}
topics=[{"gs":a['i'],"name":a['name'],"course":a.get('course',''),"courseName":courses.get(a.get('course',''),a.get('course',''))} for a in gd['achv']]

rows=[]
for t in gd['terms']:
    term=t['t']; bits=comp.get(term,63)
    for asg in t['a']:
        gs=asg[0]; diff=asg[1] if len(asg)>1 and asg[1] in ('b','i','a') else 'b'
        rows.append({"term":term,"gs":gs,"diff":diff,"bits":bits})

DATA={"generated":"2026-07-11 (snapshot 2026-07-08 structure + live completeness)","courses":gd['courses'],"topics":topics,"rows":rows}
data_json=json.dumps(DATA,ensure_ascii=False,separators=(',',':'))

TEMPLATE=r"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AP&amp;E Glossary Manager</title>
<style>
:root{--bg:#0c0c0c;--panel:#151515;--panel2:#1c1c1c;--line:#2a2a2a;--txt:#e8e8e8;--dim:#9a9a9a;--amber:#F5A623;--green:#3ec46d;--red:#e5533c;--blue:#4aa3ff;--b:#8a8a8a;--i:#4aa3ff;--a:#F5A623;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font-family:"Barlow","Segoe UI",system-ui,sans-serif;font-size:14px}
h1{font-family:"Oswald","Barlow",sans-serif;letter-spacing:.5px;margin:0;font-size:20px;text-transform:uppercase}
code,.mono{font-family:"Share Tech Mono",ui-monospace,Menlo,monospace}
header{position:sticky;top:0;z-index:20;background:linear-gradient(#111,#0c0c0c);border-bottom:1px solid var(--line);padding:10px 16px}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.spacer{flex:1}
.stat{color:var(--dim);font-size:12px}.stat b{color:var(--txt)}
input[type=search]{background:var(--panel2);border:1px solid var(--line);color:var(--txt);padding:7px 10px;border-radius:6px;min-width:220px}
button{background:var(--panel2);border:1px solid var(--line);color:var(--txt);padding:6px 10px;border-radius:6px;cursor:pointer;font-size:12px}
button:hover{border-color:var(--amber);color:#fff}
button.amber{background:var(--amber);color:#111;border-color:var(--amber);font-weight:600}
button.ghost{background:transparent}
.small{padding:3px 7px;font-size:11px}
main{padding:14px 16px 80px;max-width:1400px;margin:0 auto}
.topic{border:1px solid var(--line);border-radius:8px;margin-bottom:10px;overflow:hidden;background:var(--panel)}
.thead{display:flex;gap:10px;align-items:center;padding:10px 12px;cursor:pointer;background:var(--panel2);user-select:none}
.thead:hover{background:#232323}
.tname{font-family:"Oswald",sans-serif;text-transform:uppercase;letter-spacing:.4px;font-size:15px}
.badge{font-size:11px;padding:2px 7px;border-radius:20px;border:1px solid var(--line);color:var(--dim);white-space:nowrap}
.badge.g{color:var(--green);border-color:#255a38}
.badge.w{color:var(--amber);border-color:#5a4620}
.chev{transition:transform .15s;color:var(--dim)}
.collapsed .chev{transform:rotate(-90deg)}
.tbody{padding:6px 8px}
.collapsed .tbody{display:none}
table{width:100%;border-collapse:collapse}
th{ text-align:left;color:var(--dim);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.4px;padding:6px 8px;border-bottom:1px solid var(--line)}
td{padding:6px 8px;border-bottom:1px solid #202020;vertical-align:middle}
tr.del td{opacity:.4;text-decoration:line-through}
tr.dup{background:#141b14}
tr.hiddenrow{display:none}
.term{font-weight:600}
.tag{font-size:10px;padding:1px 5px;border-radius:4px;border:1px solid var(--line);color:var(--dim);margin-left:6px}
.diffbtns button{padding:2px 8px;font-family:"Share Tech Mono",monospace}
.diffbtns .on[data-d=b]{background:#333;color:#fff;border-color:var(--b)}
.diffbtns .on[data-d=i]{background:#123;color:#cfe6ff;border-color:var(--i)}
.diffbtns .on[data-d=a]{background:#3a2c0a;color:#ffe1a8;border-color:var(--a)}
.pips{display:inline-flex;gap:3px}
.pip{width:15px;height:15px;border-radius:3px;font-size:9px;line-height:15px;text-align:center;background:#242424;color:#555;border:1px solid #2c2c2c}
.pip.on{background:#173a24;color:var(--green);border-color:#255a38}
.cbadge{font-size:11px}
.cbadge.c{color:var(--green)}.cbadge.n{color:var(--amber)}
.drop{border:1px dashed #3a3a3a;border-radius:6px;padding:4px 8px;color:var(--dim);font-size:11px;min-width:150px;cursor:copy;text-align:center}
.drop.has{border-color:var(--green);color:var(--green);background:#0f1a12}
.drop.over{border-color:var(--amber);color:var(--amber);background:#1a150a}
.actions button{margin-left:4px}
.iconbtn{padding:3px 7px}
.legend{color:var(--dim);font-size:11px;margin:2px 0 12px}
.legend b{color:var(--txt)}
.hidden{display:none}
select{background:var(--panel2);border:1px solid var(--line);color:var(--txt);border-radius:6px;padding:4px 6px;font-size:12px}
.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#1c1c1c;border:1px solid var(--amber);color:#fff;padding:8px 14px;border-radius:8px;opacity:0;transition:.2s;z-index:50}
.toast.show{opacity:1}
.pill{font-size:11px;color:var(--dim)}
</style></head><body>
<header>
  <div class="row">
    <h1>AP&amp;E Glossary Manager</h1>
    <span class="badge" id="genbadge"></span>
    <div class="spacer"></div>
    <input type="search" id="search" placeholder="Search terms…">
    <select id="topicsort" title="Sort topics"><option value="gs">Topics: curriculum order</option><option value="name">Topics: A→Z</option><option value="incomplete">Topics: most incomplete</option></select>
    <button id="expandAll" class="ghost small">Expand all</button>
    <button id="collapseAll" class="ghost small">Collapse all</button>
    <label class="pill"><input type="checkbox" id="showHidden"> show hidden</label>
    <label class="pill"><input type="checkbox" id="showDeleted" checked> show deleted</label>
  </div>
  <div class="row" style="margin-top:8px">
    <span class="stat" id="stats"></span>
    <div class="spacer"></div>
    <button id="expImg" class="amber small">⬇ Export image map (CSV)</button>
    <button id="expChg" class="small">⬇ Export change-set (JSON)</button>
    <button id="reset" class="ghost small">Reset staged edits</button>
  </div>
</header>
<main>
  <div class="legend">Drag a <b>.png</b> onto a term to register its filename for the bucket upload · difficulty <b>B</b>/<b>I</b>/<b>A</b> is editable · pips = <b>Def · PE · PF · PA · CM · SC</b> field completeness · all edits are staged locally (nothing hits the database) and exported. </div>
  <div id="topics"></div>
</main>
<div class="toast" id="toast"></div>
<script>
const DATA=/*__DATA__*/;
const LS="apeGlossaryDash_v1";
const FIELDS=[["Def","definition"],["PE","plain_english"],["PF","purpose_function"],["PA","practical_application"],["CM","common_mistakes"],["SC","scenario_contexts"]];
const US="␟";
const key=(t,gs)=>t+US+gs;
let staged=load();
function load(){try{return Object.assign({diff:{},img:{},del:{},dup:[],hideT:{},hideTop:{},collapse:{},sort:{}},JSON.parse(localStorage.getItem(LS)||"{}"))}catch(e){return{diff:{},img:{},del:{},dup:[],hideT:{},hideTop:{},collapse:{},sort:{}}}}
function save(){localStorage.setItem(LS,JSON.stringify(staged))}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1600)}

// index rows by topic
const byTopic={};
DATA.topics.forEach(tp=>byTopic[tp.gs]={info:tp,rows:[]});
DATA.rows.forEach(r=>{(byTopic[r.gs]=byTopic[r.gs]||{info:{gs:r.gs,name:'Topic '+r.gs,courseName:''},rows:[]}).rows.push(r)});

function effDiff(r){return staged.diff[key(r.term,r.gs)]||r.diff}
function isDel(k){return !!staged.del[k]}
function bitsOf(r){return r.bits}
function missing(bits){return FIELDS.filter((f,i)=>!(bits&(1<<i))).map(f=>f[0])}

let expanded={};
function topicStats(rows){let c=0,n=0;rows.forEach(r=>{if(bitsOf(r)===63)c++;else n++});return{c,n}}

function render(){
  const q=(document.getElementById('search').value||'').trim().toLowerCase();
  const showHidden=document.getElementById('showHidden').checked;
  const showDel=document.getElementById('showDeleted').checked;
  const sortT=document.getElementById('topicsort').value;
  let tps=Object.values(byTopic);
  tps.sort((a,b)=>{
    if(sortT==='name')return a.info.name.localeCompare(b.info.name);
    if(sortT==='incomplete')return topicStats(b.rows).n-topicStats(a.rows).n;
    return a.info.gs-b.info.gs;
  });
  let totalC=0,totalN=0,imgN=Object.keys(staged.img).length,dupN=staged.dup.length,delN=Object.keys(staged.del).filter(k=>staged.del[k]).length,diffN=Object.keys(staged.diff).length;
  const host=document.getElementById('topics');host.innerHTML='';
  tps.forEach(tp=>{
    const gs=tp.info.gs;
    if(staged.hideTop[gs]&&!showHidden)return;
    const st=topicStats(tp.rows);totalC+=st.c;totalN+=st.n;
    const isColl=staged.collapse[gs]!==false? (staged.collapse[gs]===undefined?true:staged.collapse[gs]) : false;
    // default collapsed unless searching
    let coll = (staged.collapse[gs]===undefined)? true : staged.collapse[gs];
    if(q) coll=false;
    const sec=document.createElement('section');sec.className='topic'+(coll?' collapsed':'');sec.dataset.gs=gs;
    const sortMode=staged.sort[gs]||'az';
    sec.innerHTML=`<div class="thead" data-act="toggle" data-gs="${gs}">
      <span class="chev">▾</span>
      <span class="tname">${esc(tp.info.name)}</span>
      <span class="badge">gs ${gs}</span>
      <span class="badge">${esc(tp.info.courseName||'')}</span>
      <span class="badge">${tp.rows.length} terms</span>
      <span class="badge g">${st.c} complete</span>
      ${st.n?`<span class="badge w">${st.n} incomplete</span>`:''}
      <span class="spacer"></span>
      <select class="tsort" data-gs="${gs}" onclick="event.stopPropagation()">
        ${['az:A→Z','za:Z→A','incomplete:Incomplete first','diff:By difficulty'].map(o=>{const[v,l]=o.split(':');return `<option value="${v}" ${v===sortMode?'selected':''}>${l}</option>`}).join('')}
      </select>
      <button class="iconbtn ghost" data-act="hidetop" data-gs="${gs}" onclick="event.stopPropagation()" title="Hide this topic">${staged.hideTop[gs]?'🚫':'👁'}</button>
    </div><div class="tbody"></div>`;
    host.appendChild(sec);
    if(!coll) renderBody(sec.querySelector('.tbody'),tp,q,showHidden,showDel,sortMode);
  });
  document.getElementById('stats').innerHTML=
    `<b>${DATA.rows.length}</b> term-topic rows · <b>${totalC}</b> complete · <b style="color:var(--amber)">${totalN}</b> incomplete &nbsp;|&nbsp; staged: `+
    `<b>${diffN}</b> difficulty · <b>${imgN}</b> images · <b>${dupN}</b> dupes · <b>${delN}</b> deletes`;
  save();
}
function renderBody(el,tp,q,showHidden,showDel,sortMode){
  let rows=tp.rows.slice();
  // attach staged duplicates for this topic
  const dups=staged.dup.filter(d=>d.gs===tp.info.gs);
  if(sortMode==='za')rows.sort((a,b)=>b.term.localeCompare(a.term));
  else if(sortMode==='incomplete')rows.sort((a,b)=>bitsOf(a)-bitsOf(b)||a.term.localeCompare(b.term));
  else if(sortMode==='diff'){const o={b:0,i:1,a:2};rows.sort((a,b)=>o[effDiff(a)]-o[effDiff(b)]||a.term.localeCompare(b.term))}
  else rows.sort((a,b)=>a.term.localeCompare(b.term));
  let h=`<table><thead><tr><th style="width:34%">Term</th><th>Difficulty</th><th>Fields (Def·PE·PF·PA·CM·SC)</th><th>Image file</th><th style="text-align:right">Actions</th></tr></thead><tbody>`;
  const rowHtml=(r,dup)=>{
    const k=dup?('DUP'+r.id):key(r.term,r.gs);
    const del=isDel(k);
    const hid=staged.hideT[k];
    if(hid&&!showHidden)return '';
    if(del&&!showDel)return '';
    if(q&&!r.term.toLowerCase().includes(q))return '';
    const d=dup?r.diff:effDiff(r);
    const bits=dup?63:bitsOf(r); // dupes inherit; not tracked for completeness
    const miss=missing(bits);
    const img=staged.img[k];
    return `<tr class="${del?'del ':''}${dup?'dup ':''}${hid?'hiddenrow ':''}" data-k="${escAttr(k)}" data-term="${escAttr(r.term)}" data-gs="${r.gs}" ${dup?'data-dup="1"':''}>
      <td><span class="term">${esc(r.term)}</span>${dup?'<span class="tag">staged copy</span>':''}${miss.length&&!dup?'':''}</td>
      <td><span class="diffbtns">${['b','i','a'].map(x=>`<button class="small ${d===x?'on':''}" data-act="diff" data-d="${x}" data-k="${escAttr(k)}">${x.toUpperCase()}</button>`).join('')}</span></td>
      <td>${dup?'<span class="pill">(copy of existing)</span>':`<span class="pips">${FIELDS.map((f,i)=>`<span class="pip ${bits&(1<<i)?'on':''}" title="${f[1]}">${f[0][0]}</span>`).join('')}</span> <span class="cbadge ${bits===63?'c':'n'}">${bits===63?'✓ complete':'missing '+miss.join(', ')}</span>`}</td>
      <td><div class="drop ${img?'has':''}" data-act="drop" data-k="${escAttr(k)}" data-term="${escAttr(r.term)}">${img?('🖼 '+esc(img)):'drop .png →'}</div></td>
      <td class="actions" style="text-align:right;white-space:nowrap">
        <button class="iconbtn" data-act="copy" data-term="${escAttr(r.term)}" title="Copy term name">⧉</button>
        ${img?`<button class="iconbtn" data-act="clearimg" data-k="${escAttr(k)}" title="Clear image">✕img</button>`:''}
        ${dup?'':`<button class="iconbtn" data-act="dup" data-term="${escAttr(r.term)}" data-gs="${r.gs}" title="Duplicate">⧉+</button>`}
        <button class="iconbtn" data-act="hide" data-k="${escAttr(k)}" title="Hide row">👁</button>
        ${dup?`<button class="iconbtn" data-act="rmdup" data-id="${r.id}" title="Remove copy">🗑</button>`
             :`<button class="iconbtn" data-act="del" data-k="${escAttr(k)}" title="${del?'Undo delete':'Delete'}">${del?'↩':'🗑'}</button>`}
      </td></tr>`;
  };
  rows.forEach(r=>h+=rowHtml(r,false));
  dups.forEach(d=>h+=rowHtml(d,true));
  h+='</tbody></table>';
  el.innerHTML=h;
}
function esc(s){return html_escape(s)}
function html_escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function escAttr(s){return html_escape(s)}

// event delegation
document.getElementById('topics').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const act=b.dataset.act;
  if(act==='toggle'){const gs=+b.dataset.gs;staged.collapse[gs]=!currentColl(gs);render();return;}
  if(act==='hidetop'){const gs=+b.dataset.gs;staged.hideTop[gs]=!staged.hideTop[gs];render();return;}
  if(act==='diff'){staged.diff[b.dataset.k]=b.dataset.d;render();return;}
  if(act==='copy'){navigator.clipboard.writeText(b.dataset.term).then(()=>toast('Copied: '+b.dataset.term));return;}
  if(act==='dup'){const id=Date.now()+''+Math.floor(Math.random()*999);staged.dup.push({id,term:b.dataset.term+' (copy)',gs:+b.dataset.gs,diff:'b'});toast('Duplicated (staged)');render();return;}
  if(act==='rmdup'){staged.dup=staged.dup.filter(d=>d.id!==b.dataset.id);render();return;}
  if(act==='del'){staged.del[b.dataset.k]=!staged.del[b.dataset.k];render();return;}
  if(act==='hide'){staged.hideT[b.dataset.k]=!staged.hideT[b.dataset.k];render();return;}
  if(act==='clearimg'){delete staged.img[b.dataset.k];render();return;}
});
function currentColl(gs){return (staged.collapse[gs]===undefined)?true:staged.collapse[gs]}

document.getElementById('topics').addEventListener('change',e=>{
  const s=e.target.closest('.tsort');if(s){staged.sort[+s.dataset.gs]=s.value;render();}
});
// drag & drop image files
document.getElementById('topics').addEventListener('dragover',e=>{const d=e.target.closest('[data-act=drop]');if(d){e.preventDefault();d.classList.add('over');}});
document.getElementById('topics').addEventListener('dragleave',e=>{const d=e.target.closest('[data-act=drop]');if(d)d.classList.remove('over');});
document.getElementById('topics').addEventListener('drop',e=>{const d=e.target.closest('[data-act=drop]');if(!d)return;e.preventDefault();d.classList.remove('over');
  const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(!f){toast('No file');return;}
  staged.img[d.dataset.k]=f.name;toast('Registered "'+f.name+'" → '+d.dataset.term);render();});

document.getElementById('search').addEventListener('input',()=>render());
document.getElementById('topicsort').addEventListener('change',()=>render());
document.getElementById('showHidden').addEventListener('change',()=>render());
document.getElementById('showDeleted').addEventListener('change',()=>render());
document.getElementById('expandAll').addEventListener('click',()=>{Object.keys(byTopic).forEach(gs=>staged.collapse[gs]=false);render()});
document.getElementById('collapseAll').addEventListener('click',()=>{Object.keys(byTopic).forEach(gs=>staged.collapse[gs]=true);render()});
document.getElementById('reset').addEventListener('click',()=>{if(confirm('Clear ALL staged edits (difficulty, images, dupes, deletes)? This cannot be undone.')){staged={diff:{},img:{},del:{},dup:[],hideT:{},hideTop:{},collapse:{},sort:{}};save();render();toast('Staged edits cleared')}});

function dl(name,text,mime){const b=new Blob([text],{type:mime});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
document.getElementById('expImg').addEventListener('click',()=>{
  const seen={};let lines=[['term','image_filename']];
  Object.keys(staged.img).forEach(k=>{const term=k.split(US)[0]; if(k.startsWith('DUP'))return; if(seen[term])return; seen[term]=1; lines.push([term,staged.img[k]]);});
  const csv=lines.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  if(lines.length<2){toast('No images registered yet');return;}
  dl('ape_glossary_image_map.csv',csv,'text/csv');toast('Exported '+(lines.length-1)+' image mappings');
});
document.getElementById('expChg').addEventListener('click',()=>{
  const cs={generated:new Date().toISOString(),
    difficultyChanges:Object.keys(staged.diff).map(k=>({term:k.split(US)[0],gs:+k.split(US)[1],newDifficulty:staged.diff[k]})),
    imageMap:Object.keys(staged.img).filter(k=>!k.startsWith('DUP')).map(k=>({term:k.split(US)[0],gs:+k.split(US)[1],filename:staged.img[k]})),
    duplicates:staged.dup.map(d=>({newTerm:d.term,gs:d.gs,difficulty:d.diff})),
    deletes:Object.keys(staged.del).filter(k=>staged.del[k]&&!k.startsWith('DUP')).map(k=>({term:k.split(US)[0],gs:+k.split(US)[1]}))};
  dl('ape_glossary_changeset.json',JSON.stringify(cs,null,2),'application/json');toast('Exported change-set');
});
document.getElementById('genbadge').textContent=DATA.generated;
render();
</script></body></html>"""

htmlout=TEMPLATE.replace("/*__DATA__*/", data_json)
open(OUT,"w",encoding="utf-8").write(htmlout)
print("terms:",len(gd['terms']),"rows(assignments):",len(rows))
print("bytes:",len(htmlout))
print("saved:",OUT)
print("bytes:",len(htmlout))
print("saved:",OUT)
