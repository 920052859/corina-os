// ═══════════════════════════════════════════════════
// CORINA OS — APP LOGIC
// ═══════════════════════════════════════════════════

// ── STATE ──
let ST = {
  habits:{}, habitsDef:null,
  milestones:{}, skills:{},
  etf:{total:0, aportes:[]},
  gastos:[], boletas:[],
  notes:[], plannerDone:{},
  posts:[], meals:[], exercises:[], measures:[],
  phrases:{},           // {dateKey: {myPhrase}}
  habitComments:{},     // {habitId_dateKey: comment}
  dailySnapshots:{},    // {dateKey: snapshot}
  ghConfig:{token:'',user:'',repo:''},
  lastUpdated:null,
  currentReceipt:null,
  currentReceiptB64:null,
  currentMealPhoto:null,
  currentFinanceMonth:null,
};

let plannerFilter = 'today';
let ownerFilter = 'all';

// ── STORAGE ──
function LS(k,v){try{localStorage.setItem('corina_v5_'+k,JSON.stringify(v));}catch(e){}}
function LG(k,d){try{const v=localStorage.getItem('corina_v5_'+k);return v?JSON.parse(v):d;}catch(e){return d;}}
function loadAll(){const s=LG('state',null);if(s)ST={...ST,...s};}
function saveAll(){
  ST.lastUpdated=new Date().toLocaleString('es-PE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  LS('state',ST);
  updateLastUpd();
  flashSaveBtn();
}
function flashSaveBtn(){
  const b=document.getElementById('saveBtn');
  if(b){const o=b.innerHTML;b.innerHTML='✓ GUARDADO';setTimeout(()=>b.innerHTML=o,1500);}
}
function updateLastUpd(){
  const el=document.getElementById('lastUpd');
  if(el&&ST.lastUpdated)el.textContent=ST.lastUpdated;
}
setInterval(saveAll,15000);

// ── DAILY SAVE (at end of day button) ──
function saveDailySnapshot(){
  const today=new Date().toISOString().slice(0,10);
  const defs=getHDef();
  const snapshot={
    date:today,
    habits:defs.map(h=>({
      id:h.id, name:h.name,
      done:ST.habits[h.id]?.today||false,
      comment:ST.habitComments[h.id+'_'+today]||''
    })),
    completedCount:defs.filter(h=>ST.habits[h.id]?.today).length,
    totalHabits:defs.length
  };
  if(!ST.dailySnapshots)ST.dailySnapshots={};
  ST.dailySnapshots[today]=snapshot;
  // Shift week
  defs.forEach(h=>{
    if(!ST.habits[h.id])ST.habits[h.id]={today:false,week:[0,0,0,0,0,0,0],streak:0};
    const w=ST.habits[h.id].week;
    w.shift();w.push(ST.habits[h.id].today?1:0);
    ST.habits[h.id].today=false;
  });
  saveAll();renderHabits();
  alert('✅ Día guardado correctamente. Historial actualizado.');
}

// ── NAVIGATION ──
function gp(id,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  if(btn)btn.classList.add('active');
  else document.querySelectorAll('.nav-tab').forEach(t=>{
    if(t.getAttribute('onclick')&&t.getAttribute('onclick').includes("'"+id+"'"))t.classList.add('active');
  });
  if(id==='finanzas-expert')renderFinanceExpert();
}

// ── MODAL ──
function om(id){document.getElementById(id).classList.add('open');if(id==='mSync')refreshJSON();}
function cm(id){document.getElementById(id).classList.remove('open');}
function initModals(){
  document.querySelectorAll('.mo').forEach(m=>{
    m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');});
  });
}

// ── JSON ──
function getJSON(){return JSON.stringify(ST,null,2);}
function refreshJSON(){const el=document.getElementById('jsonPrev');if(el)el.value=getJSON();}
function exportJSON(){
  saveAll();
  const b=new Blob([getJSON()],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(b);
  a.download='corina_os_'+new Date().toISOString().slice(0,7)+'.json';
  a.click();
}
function copyJSON(){
  navigator.clipboard.writeText(getJSON()).then(()=>{
    const btn=document.querySelector('#mSync .btn:nth-child(3)');
    if(btn){const o=btn.textContent;btn.textContent='✓';setTimeout(()=>btn.textContent=o,1500);}
  });
}
function importJSON(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    try{const d=JSON.parse(ev.target.result);ST={...ST,...d};saveAll();renderAll();cm('mSync');alert('✅ Datos importados.');}
    catch(err){alert('Error al leer el JSON.');}
  };
  r.readAsText(f);
}

// ── DRAGON CURSOR ──
function initDragonCursor(){
  const cur=document.getElementById('cur');
  const canvas=document.getElementById('dragonCanvas');
  const ctx=canvas.getContext('2d');
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
  resize();
  window.addEventListener('resize',resize);
  let mx=window.innerWidth/2,my=window.innerHeight/2;
  const pts=[];
  document.addEventListener('mousemove',e=>{
    mx=e.clientX;my=e.clientY;
    cur.style.left=mx+'px';cur.style.top=my+'px';
    if(Math.random()>.6){pts.push({x:mx+(Math.random()-.5)*18,y:my+(Math.random()-.5)*18,vx:(Math.random()-.5)*1.8,vy:-Math.random()*2.5-.5,life:1,size:Math.random()*3.5+.8,type:Math.random()>.5?'fire':'spark'});}
  });
  document.addEventListener('touchmove',e=>{const t=e.touches[0];mx=t.clientX;my=t.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';},{passive:true});
  (function anim(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=pts.length-1;i>=0;i--){
      const p=pts[i];p.x+=p.vx;p.y+=p.vy;p.life-=.025;p.vy+=.04;
      if(p.life<=0){pts.splice(i,1);continue;}
      ctx.globalAlpha=p.life*.75;
      if(p.type==='fire'){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*2);g.addColorStop(0,'rgba(240,168,32,.9)');g.addColorStop(1,'rgba(240,80,32,0)');ctx.fillStyle=g;}
      else ctx.fillStyle=`rgba(212,168,67,${p.life})`;
      ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(anim);
  })();
}

// ═══════════════════════════════════════════════════
// PHRASES
// ═══════════════════════════════════════════════════
function renderPhrase(container, showForm=true){
  if(!container)return;
  const today=new Date();
  const dateKey=today.toISOString().slice(0,10);
  const phrase=getPhraseForDate(today);
  const myPhrase=ST.phrases?.[dateKey]||'';
  container.innerHTML=`
    <div class="phrase-card">
      <div class="phrase-day">Día ${phrase.dayOfYear} de 2026 · ${today.toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'})}</div>
      <span class="phrase-cat">${phrase.cat}</span>
      <div class="phrase-text">"${phrase.text}"</div>
      <div class="phrase-author">— ${phrase.author}</div>
      ${showForm?`<div class="phrase-own">
        <div style="font-family:var(--fm);font-size:9px;color:var(--m2);margin-bottom:6px;letter-spacing:.15em;">✨ TU FRASE DE HOY</div>
        <input class="phrase-own-input" type="text" id="myPhrase_${dateKey}" placeholder="Escribí tu reflexión de hoy..." value="${myPhrase.replace(/"/g,'&quot;')}" oninput="saveMyPhrase('${dateKey}',this.value)">
      </div>`:''}
    </div>`;
}
function renderPhrasePage(){
  renderPhrase(document.getElementById('phraseMain'),true);
  const sp=document.getElementById('savedPhrases');if(!sp)return;
  const ps=Object.entries(ST.phrases||{}).filter(([,v])=>v&&v.trim()).sort((a,b)=>b[0].localeCompare(a[0]));
  sp.innerHTML=ps.length?ps.slice(0,20).map(([d,t])=>`
    <div class="logi" style="border-left-color:var(--gold)">
      <div><div class="lt">${t}</div><div class="lm">Mi frase del día</div></div>
      <div class="ld">${d}</div></div>`).join('')
    :'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);">Aún no guardaste frases propias.</div>';
}
function saveMyPhrase(dateKey,val){if(!ST.phrases)ST.phrases={};ST.phrases[dateKey]=val;saveAll();}

// ═══════════════════════════════════════════════════
// HABITS
// ═══════════════════════════════════════════════════
function getHDef(){return ST.habitsDef||HABITS_DEFAULT;}

function renderHabits(){
  const g=document.getElementById('habitGrid');if(!g)return;
  const defs=getHDef();
  const todayKey=new Date().toISOString().slice(0,10);
  let done=0;
  g.innerHTML='';
  defs.forEach(h=>{
    if(!ST.habits[h.id])ST.habits[h.id]={today:false,week:[0,0,0,0,0,0,0],streak:0};
    const hd=ST.habits[h.id];
    if(hd.today)done++;
    const col=COLORS[h.c]||'var(--jade)';
    const commentKey=h.id+'_'+todayKey;
    const comment=ST.habitComments?.[commentKey]||'';
    const div=document.createElement('div');div.className='hcard';
    div.innerHTML=`
      <div class="hcard-top">
        <div class="hchk${hd.today?' on':''}" onclick="togH('${h.id}')"></div>
        <div style="flex:1"><div class="hcard-name">${h.name}</div><div class="hcard-time">${h.time||''}</div></div>
        <div class="hcard-freq">${h.freq}</div>
      </div>
      ${comment?`<div class="hcard-comment">💬 ${comment}</div>`:''}
      <div class="wdots">${hd.week.map((v,i)=>`<div class="wdot${v?' on':''}" style="${v?`background:${col};border-color:${col};box-shadow:0 0 4px ${col}`:''}" onclick="togD('${h.id}',${i})"></div>`).join('')}</div>
      <div class="hstreak">Racha: <span>${hd.streak}</span> días · L M X J V S D</div>
      <div class="hcard-btns">
        <div class="hbtn save" onclick="openHComment('${h.id}')">💬 ${comment?'Editar':'Agregar'} nota</div>
        <div class="hbtn" onclick="editHabit('${h.id}')">✏️ Editar</div>
      </div>`;
    g.appendChild(div);
  });
  const hh=document.getElementById('habitHome');if(hh)hh.textContent=done+'/'+defs.length;
}

function togH(id){
  if(!ST.habits[id])ST.habits[id]={today:false,week:[0,0,0,0,0,0,0],streak:0};
  ST.habits[id].today=!ST.habits[id].today;
  renderHabits();saveAll();
}
function togD(id,i){
  if(!ST.habits[id])ST.habits[id]={today:false,week:[0,0,0,0,0,0,0],streak:0};
  ST.habits[id].week[i]=ST.habits[id].week[i]?0:1;
  let s=0;const w=ST.habits[id].week;
  for(let j=w.length-1;j>=0;j--){if(w[j])s++;else break;}
  ST.habits[id].streak=s;
  renderHabits();saveAll();
}

// HABIT COMMENTS (new functional system)
function openHComment(id){
  const h=getHDef().find(x=>x.id===id);if(!h)return;
  const todayKey=new Date().toISOString().slice(0,10);
  const key=id+'_'+todayKey;
  document.getElementById('mHCTtl').textContent='💬 '+h.name;
  document.getElementById('mHCSub').textContent='Nota del '+new Date().toLocaleDateString('es-PE');
  document.getElementById('hCommentInput').value=ST.habitComments?.[key]||'';
  document.getElementById('hCommentId').value=id;
  om('mHComment');
}
function saveHComment(){
  const id=document.getElementById('hCommentId').value;
  const txt=document.getElementById('hCommentInput').value.trim();
  const todayKey=new Date().toISOString().slice(0,10);
  const key=id+'_'+todayKey;
  if(!ST.habitComments)ST.habitComments={};
  if(txt)ST.habitComments[key]=txt;else delete ST.habitComments[key];
  cm('mHComment');renderHabits();saveAll();
}

// ADD/EDIT HABIT
function openAddHabit(){
  ['hName','hTime'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('hEditId').value='';
  document.getElementById('mHabitTtl').textContent='+ Agregar hábito';
  const del=document.getElementById('delHBtn');if(del)del.style.display='none';
  om('mHabit');
}
function editHabit(id){
  const h=getHDef().find(x=>x.id===id);if(!h)return;
  document.getElementById('hName').value=h.name;
  document.getElementById('hTime').value=h.time||'';
  document.getElementById('hFreq').value=h.freq;
  document.getElementById('hColor').value=h.c;
  document.getElementById('hEditId').value=id;
  document.getElementById('mHabitTtl').textContent='✏️ Editar hábito';
  const del=document.getElementById('delHBtn');if(del)del.style.display='inline-block';
  om('mHabit');
}
function saveHabit(){
  const name=document.getElementById('hName').value.trim();if(!name)return;
  const id=document.getElementById('hEditId').value;
  let defs=[...getHDef()];
  const hab={id:id||'h_'+Date.now(),name,time:document.getElementById('hTime').value,freq:document.getElementById('hFreq').value,c:document.getElementById('hColor').value};
  if(id){const idx=defs.findIndex(x=>x.id===id);if(idx>=0)defs[idx]=hab;}else defs.push(hab);
  ST.habitsDef=defs;
  cm('mHabit');renderHabits();saveAll();
}
function deleteHabit(){
  const id=document.getElementById('hEditId').value;
  if(!id||!confirm('¿Eliminar este hábito?'))return;
  ST.habitsDef=getHDef().filter(x=>x.id!==id);
  cm('mHabit');renderHabits();saveAll();
}

// ═══════════════════════════════════════════════════
// PLANNER (swipe-to-complete list style)
// ═══════════════════════════════════════════════════
function renderPlanner(){
  const g=document.getElementById('plannerList');if(!g)return;
  // Build flat list of activities
  const items=[];
  PLANNER.forEach((row,ri)=>{
    row.d.forEach((txt,di)=>{
      if(txt&&txt!=='—'&&txt.trim()!==''){
        items.push({id:`${ri}_${di}`,time:row.t,text:txt,day:DAYS_WEEK[di],dayIdx:di,color:row.c[di]});
      }
    });
  });
  // Filter by day
  const today=new Date().getDay();
  const todayIdx=today===0?6:today-1; // 0=lun
  const filtered=plannerFilter==='today'?items.filter(i=>i.dayIdx===todayIdx):
    plannerFilter==='all'?items:items.filter(i=>i.dayIdx===parseInt(plannerFilter));
  g.innerHTML=filtered.length?filtered.map(it=>{
    const done=ST.plannerDone?.[it.id];
    const dayClass=it.day.toLowerCase().replace('é','e').replace('á','a');
    return `<div class="planner-item ${dayClass}${done?' done':''}" onclick="togPlanner('${it.id}')">
      <div class="pi-check"></div>
      <div class="pi-time">${it.time}</div>
      <div class="pi-text">${it.text}</div>
      <div class="pi-day">${it.day}</div>
    </div>`;
  }).join(''):'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);padding:20px;text-align:center;">Sin actividades programadas para este filtro.</div>';
}
function togPlanner(k){
  if(!ST.plannerDone)ST.plannerDone={};
  ST.plannerDone[k]=!ST.plannerDone[k];
  renderPlanner();saveAll();
}
function setPlannerFilter(f,btn){
  plannerFilter=f;
  document.querySelectorAll('#dayFilters .dtab').forEach(t=>t.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderPlanner();
}

// ═══════════════════════════════════════════════════
// CONTENT PLANNER
// ═══════════════════════════════════════════════════
function renderPosts(){
  const g=document.getElementById('postsGrid');if(!g)return;
  const posts=ST.posts||[];
  const filtered=ownerFilter==='all'?posts:posts.filter(p=>p.owner===ownerFilter);
  g.innerHTML=filtered.length?filtered.map(p=>{
    const owner=OWNERS.find(o=>o.id===p.owner);
    const ownerBadge=owner?`<span class="cp-owner-badge" style="color:${owner.color}">${owner.icon} ${owner.name.split('·')[0].trim()}</span>`:'';
    const platClass=({linkedin:'p-li',instagram:'p-ig',tiktok:'p-tt',youtube:'p-yt'})[p.plat]||'p-li';
    return `<div class="cp-card" style="border-top-color:${owner?.color||'var(--jade)'}">
      <div class="cp-head">
        ${ownerBadge}
        <span class="cp-status ${p.status==='published'?'st-pub':p.status==='scheduled'?'st-sched':'st-draft'}">${p.status==='published'?'PUBLICADO':p.status==='scheduled'?'PROGRAMADO':'BORRADOR'}</span>
      </div>
      <div class="cp-body">
        <div style="margin-bottom:6px;"><span class="pbadge ${platClass}">${({linkedin:'LinkedIn',instagram:'Instagram',tiktok:'TikTok',youtube:'YouTube',multi:'Multi'})[p.plat]||p.plat}</span></div>
        <div class="cp-title">${p.title||'Sin título'}</div>
        ${p.hook?`<div class="cp-desc" style="color:var(--g2);font-style:italic;">"${p.hook}"</div>`:''}
        <div class="cp-desc">${p.desc||''}</div>
        ${p.date?`<div class="cp-date">📅 ${p.date}</div>`:''}
        ${p.link?`<div style="font-family:var(--fm);font-size:9px;margin-bottom:4px;"><a href="${p.link}" target="_blank" style="color:var(--jade);">🔗 Ver publicación</a></div>`:''}
        ${(p.likes||p.comments||p.shares||p.reach)?`<div class="cp-metrics">
          ${p.likes?`<div class="cp-metric"><div class="cp-metric-val">${p.likes}</div><div class="cp-metric-lbl">❤</div></div>`:''}
          ${p.comments?`<div class="cp-metric"><div class="cp-metric-val">${p.comments}</div><div class="cp-metric-lbl">💬</div></div>`:''}
          ${p.shares?`<div class="cp-metric"><div class="cp-metric-val">${p.shares}</div><div class="cp-metric-lbl">↗</div></div>`:''}
          ${p.reach?`<div class="cp-metric"><div class="cp-metric-val">${p.reach}</div><div class="cp-metric-lbl">👁</div></div>`:''}
        </div>`:''}
        <div class="cp-btns">
          <button class="btn bj" style="font-size:8px;padding:5px 10px;" onclick="editPost('${p.id}')">✏️ Editar</button>
          ${p.status!=='published'?`<button class="btn bg" style="font-size:8px;padding:5px 10px;" onclick="markPublished('${p.id}')">✓ Publicar</button>`:''}
        </div>
      </div>
    </div>`;
  }).join(''):'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);grid-column:1/-1;text-align:center;padding:20px;">Sin posts en esta categoría.</div>';
  // Home KPI
  const ph=document.getElementById('postsHome');
  if(ph)ph.textContent=posts.filter(p=>p.status==='published').length;
}
function setOwnerFilter(f,btn){
  ownerFilter=f;
  document.querySelectorAll('.otab').forEach(t=>t.classList.remove('active'));
  if(btn){btn.classList.add('active');if(f!=='all'){const o=OWNERS.find(o=>o.id===f);if(o)btn.style.borderColor=o.color;}}
  renderPosts();
}
function openAddPost(){
  ['pTitle','pDesc','pHook','pHashtags','pLink'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  ['pLikes','pComments','pShares','pReach'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  document.getElementById('pEditId').value='';
  document.getElementById('pStatus').value='draft';
  document.getElementById('mPostTtl').textContent='+ Nueva publicación';
  const db=document.getElementById('delPostBtn');if(db)db.style.display='none';
  om('mPost');
}
function editPost(id){
  const p=(ST.posts||[]).find(x=>x.id===id);if(!p)return;
  const v=(i,val)=>{const el=document.getElementById(i);if(el)el.value=val||'';};
  v('pTitle',p.title);v('pDesc',p.desc);v('pHook',p.hook);v('pHashtags',p.hashtags);
  v('pDate',p.date);v('pLink',p.link);v('pLikes',p.likes);v('pComments',p.comments);
  v('pShares',p.shares);v('pReach',p.reach);
  document.getElementById('pStatus').value=p.status||'draft';
  document.getElementById('pPlat').value=p.plat||'linkedin';
  document.getElementById('pOwner').value=p.owner||'corina';
  document.getElementById('pEditId').value=id;
  document.getElementById('mPostTtl').textContent='✏️ Editar publicación';
  const db=document.getElementById('delPostBtn');if(db)db.style.display='inline-block';
  om('mPost');
}
function savePost(){
  const id=document.getElementById('pEditId').value;
  const post={
    id:id||'p_'+Date.now(),
    owner:document.getElementById('pOwner').value,
    plat:document.getElementById('pPlat').value,
    title:document.getElementById('pTitle').value,
    desc:document.getElementById('pDesc').value,
    hook:document.getElementById('pHook').value,
    hashtags:document.getElementById('pHashtags').value,
    date:document.getElementById('pDate').value,
    status:document.getElementById('pStatus').value,
    link:document.getElementById('pLink').value,
    likes:document.getElementById('pLikes').value,
    comments:document.getElementById('pComments').value,
    shares:document.getElementById('pShares').value,
    reach:document.getElementById('pReach').value,
  };
  if(!ST.posts)ST.posts=[];
  if(id){const idx=ST.posts.findIndex(x=>x.id===id);if(idx>=0)ST.posts[idx]={...ST.posts[idx],...post};}
  else ST.posts.unshift(post);
  cm('mPost');renderPosts();saveAll();
}
function deletePost(){
  const id=document.getElementById('pEditId').value;
  if(!id||!confirm('¿Eliminar post?'))return;
  ST.posts=(ST.posts||[]).filter(x=>x.id!==id);
  cm('mPost');renderPosts();saveAll();
}
function markPublished(id){
  const p=(ST.posts||[]).find(x=>x.id===id);if(!p)return;
  p.status='published';renderPosts();saveAll();
}

// ═══════════════════════════════════════════════════
// BITÁCORA ALIMENTACIÓN/EJERCICIO
// ═══════════════════════════════════════════════════
function readFileAsBase64(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=e=>resolve(e.target.result);
    r.onerror=reject;
    r.readAsDataURL(file);
  });
}
async function handleMealPhoto(e){
  const f=e.target.files[0];if(!f)return;
  ST.currentMealPhoto=await readFileAsBase64(f);
  const p=document.getElementById('mealPhotoPreview');
  if(p){p.src=ST.currentMealPhoto;p.style.display='block';}
}
function saveMeal(){
  const type=document.getElementById('mealType').value;
  const name=document.getElementById('mealName').value.trim();
  const desc=document.getElementById('mealDesc').value.trim();
  if(!name)return;
  if(!ST.meals)ST.meals=[];
  ST.meals.unshift({
    id:'m_'+Date.now(),type,name,desc,
    photo:ST.currentMealPhoto,
    date:new Date().toISOString().slice(0,10),
    time:new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})
  });
  ['mealName','mealDesc'].forEach(i=>document.getElementById(i).value='');
  ST.currentMealPhoto=null;
  const p=document.getElementById('mealPhotoPreview');if(p)p.style.display='none';
  document.getElementById('mealPhotoFile').value='';
  renderMeals();saveAll();
}
function renderMeals(){
  const g=document.getElementById('mealsGrid');if(!g)return;
  const meals=ST.meals||[];
  g.innerHTML=meals.length?meals.slice(0,30).map(m=>`
    <div class="meal-card">
      ${m.photo?`<img src="${m.photo}" class="meal-img" alt="${m.name}">`:`<div class="meal-no-img">🍽</div>`}
      <div class="meal-body">
        <div class="meal-type">${m.type}</div>
        <div class="meal-name">${m.name}</div>
        ${m.desc?`<div class="meal-desc">${m.desc}</div>`:''}
        <div class="meal-date">📅 ${m.date} · ${m.time||''}</div>
      </div>
    </div>`).join('')
    :'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);grid-column:1/-1;text-align:center;padding:16px;">Sin registros de comidas.</div>';
}

function saveExercise(){
  const name=document.getElementById('exName').value.trim();
  const sets=document.getElementById('exSets').value;
  const reps=document.getElementById('exReps').value;
  const weight=document.getElementById('exWeight').value;
  if(!name)return;
  if(!ST.exercises)ST.exercises=[];
  ST.exercises.unshift({
    id:'e_'+Date.now(),name,sets,reps,weight,
    date:new Date().toISOString().slice(0,10),
    time:new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})
  });
  ['exName','exSets','exReps','exWeight'].forEach(i=>document.getElementById(i).value='');
  renderExercises();saveAll();
}
function renderExercises(){
  const g=document.getElementById('exercisesList');if(!g)return;
  const ex=ST.exercises||[];
  g.innerHTML=ex.length?ex.slice(0,30).map(e=>`
    <div class="logi" style="border-left-color:var(--crimson)">
      <div><div class="lt">${e.name}</div><div class="lm">${e.sets||'—'}×${e.reps||'—'} · ${e.weight||'s/peso'} kg</div></div>
      <div class="ld">${e.date}</div></div>`).join('')
    :'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);">Sin ejercicios.</div>';
}

function saveMeasure(){
  const weight=document.getElementById('msWeight').value;
  const waist=document.getElementById('msWaist').value;
  const chest=document.getElementById('msChest').value;
  const notes=document.getElementById('msNotes').value.trim();
  if(!weight&&!waist&&!chest)return;
  if(!ST.measures)ST.measures=[];
  ST.measures.unshift({
    id:'me_'+Date.now(),weight,waist,chest,notes,
    date:new Date().toISOString().slice(0,10)
  });
  ['msWeight','msWaist','msChest','msNotes'].forEach(i=>document.getElementById(i).value='');
  renderMeasures();saveAll();
}
function renderMeasures(){
  const g=document.getElementById('measuresList');if(!g)return;
  const ms=ST.measures||[];
  g.innerHTML=ms.length?ms.slice(0,15).map(m=>`
    <div class="logi" style="border-left-color:var(--violet)">
      <div><div class="lt">${m.weight?m.weight+' kg':''} ${m.waist?'· cintura '+m.waist+'cm':''} ${m.chest?'· pecho '+m.chest+'cm':''}</div>
      <div class="lm">${m.notes||'—'}</div></div>
      <div class="ld">${m.date}</div></div>`).join('')
    :'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);">Sin medidas registradas.</div>';
}

// ═══════════════════════════════════════════════════
// FINANZAS + EXPERTO POR MES
// ═══════════════════════════════════════════════════
function saveGasto(){
  const tipo=document.getElementById('gTipo').value;
  const cat=document.getElementById('gCat').value;
  const desc=document.getElementById('gDesc').value.trim();
  const monto=parseFloat(document.getElementById('gMonto').value);
  const fecha=document.getElementById('gFecha').value||new Date().toISOString().slice(0,10);
  if(!monto||monto<=0||!desc)return;
  if(!ST.gastos)ST.gastos=[];
  ST.gastos.unshift({id:'g_'+Date.now(),tipo,cat,desc,monto,fecha});
  cm('mGasto');
  ['gDesc','gMonto'].forEach(i=>document.getElementById(i).value='');
  renderGastos();renderFinanceExpert();saveAll();
}
function renderGastos(){
  const d=document.getElementById('gastosList');if(!d)return;
  const gs=ST.gastos||[];
  const egresos=gs.filter(g=>g.tipo==='egreso').reduce((a,g)=>a+g.monto,0);
  const el=document.getElementById('hormiTotal');if(el)el.textContent='S/'+egresos.toFixed(0);
  const etfT=ST.etf?.total||0;
  ['etfHome','etfFin'].forEach(i=>{const e=document.getElementById(i);if(e)e.textContent='S/'+etfT.toLocaleString('es-PE');});
  d.innerHTML=gs.length?gs.slice(0,30).map(g=>`
    <div class="logi" style="border-left-color:${g.tipo==='ingreso'?'var(--jade)':'var(--crimson)'}">
      <div><div class="lt">${g.desc}${g.source==='boleta_ia'?' 🤖':''}</div><div class="lm">${g.cat.toUpperCase()} · ${g.fecha}</div></div>
      <div class="ld" style="color:${g.tipo==='ingreso'?'var(--jade)':'var(--crimson)'}">
        ${g.tipo==='ingreso'?'+':'−'}S/${g.monto.toFixed(2)}</div></div>`).join('')
    :'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);">Sin movimientos.</div>';
}

function renderFinanceExpert(){
  const c=document.getElementById('financeExpert');if(!c)return;
  // Setup month selector
  const today=new Date();
  if(!ST.currentFinanceMonth)ST.currentFinanceMonth=today.toISOString().slice(0,7);
  const months=[];
  for(let i=11;i>=0;i--){
    const d=new Date(today.getFullYear(),today.getMonth()-i,1);
    const key=d.toISOString().slice(0,7);
    const lbl=d.toLocaleDateString('es-PE',{month:'long',year:'numeric'});
    months.push({key,lbl});
  }
  // Filter gastos for month
  const month=ST.currentFinanceMonth;
  const gs=(ST.gastos||[]).filter(g=>{
    const d=g.fecha?.length>=7?g.fecha.slice(0,7):null;
    return d===month || (d===null && month===today.toISOString().slice(0,7));
  });

  // Categorize
  const categories={};
  let totalEgreso=0,totalIngreso=0;
  gs.forEach(g=>{
    if(g.tipo==='egreso'){
      categories[g.cat]=(categories[g.cat]||0)+g.monto;
      totalEgreso+=g.monto;
    }else totalIngreso+=g.monto;
  });

  // Fixed expenses estimate
  const FIXED=4817; // maestría + depa + comida + actividades
  const INCOME_DEFAULT=6002;
  const incomeEst=totalIngreso>0?totalIngreso+INCOME_DEFAULT:INCOME_DEFAULT;
  const variableExp=totalEgreso;
  const totalExp=FIXED+variableExp;
  const netto=incomeEst-totalExp;
  const savingRate=((netto/incomeEst)*100).toFixed(1);

  // Generate advice
  let advice='';
  if(netto<0)advice=`⚠️ Este mes gastaste <strong>S/${Math.abs(netto).toFixed(0)} más</strong> de tu ingreso. Revisá las categorías hormiga — ahí suele estar la fuga.`;
  else if(savingRate<20)advice=`💡 Estás ahorrando <strong>${savingRate}%</strong>. La meta debería ser 35-45%. Reducí gastos en las 2 categorías más altas.`;
  else if(savingRate<45)advice=`✅ Buen mes. Ahorrando <strong>${savingRate}%</strong>. Destiná S/${(netto*0.7).toFixed(0)} a ETF VOO este mes para acelerar tu libertad financiera.`;
  else advice=`🔥 ¡Excelente! <strong>${savingRate}%</strong> de ahorro. Considera aumentar aportes ETF a S/${(netto*0.8).toFixed(0)}/mes y destinar el resto a tu fondo hacienda.`;

  const catHTML=Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>`
    <div class="fe-category">
      <div class="fe-cat-name">${cat.toUpperCase()}</div>
      <div class="fe-cat-val">S/${val.toFixed(2)}</div>
    </div>`).join('');

  c.innerHTML=`
    <div class="fe-header">
      <div class="fe-title">💼 Resumen Financiero — Modo Experto</div>
      <select class="fe-month-select" onchange="changeFinanceMonth(this.value)">
        ${months.map(m=>`<option value="${m.key}"${m.key===month?' selected':''}>${m.lbl}</option>`).join('')}
      </select>
    </div>
    <div class="fe-section">
      <div class="fe-section-title">📊 Ingreso del mes</div>
      <div class="fe-category"><div class="fe-cat-name">Ingreso laboral fijo</div><div class="fe-cat-val" style="color:var(--jade)">S/${INCOME_DEFAULT.toFixed(2)}</div></div>
      ${totalIngreso>0?`<div class="fe-category"><div class="fe-cat-name">Otros ingresos</div><div class="fe-cat-val" style="color:var(--jade)">+S/${totalIngreso.toFixed(2)}</div></div>`:''}
      <div class="fe-category" style="border-top:2px solid var(--border);padding-top:10px;margin-top:6px;"><div class="fe-cat-name" style="font-weight:700;">TOTAL INGRESO</div><div class="fe-cat-val" style="color:var(--jade);font-size:14px;">S/${incomeEst.toFixed(2)}</div></div>
    </div>
    <div class="fe-section">
      <div class="fe-section-title">🏷️ Gastos fijos (recurrentes)</div>
      <div class="fe-category"><div class="fe-cat-name">Maestría ESAN</div><div class="fe-cat-val">S/1,740.00</div></div>
      <div class="fe-category"><div class="fe-cat-name">Depa Ate + Comida</div><div class="fe-cat-val">S/1,400.00</div></div>
      <div class="fe-category"><div class="fe-cat-name">ICPNA + Gym + Pole + Piscina</div><div class="fe-cat-val">S/800.00</div></div>
      <div class="fe-category"><div class="fe-cat-name">Otros (celular, Shakira, pasajes)</div><div class="fe-cat-val">S/877.00</div></div>
      <div class="fe-category" style="border-top:2px solid var(--border);padding-top:10px;margin-top:6px;"><div class="fe-cat-name" style="font-weight:700;">TOTAL FIJO</div><div class="fe-cat-val" style="color:var(--crimson);font-size:14px;">S/${FIXED.toFixed(2)}</div></div>
    </div>
    <div class="fe-section">
      <div class="fe-section-title">💸 Gastos variables por categoría</div>
      ${catHTML||'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);padding:8px 0;">Sin gastos variables registrados este mes. Escaneá boletas para generar el historial.</div>'}
      ${totalEgreso>0?`<div class="fe-category" style="border-top:2px solid var(--border);padding-top:10px;margin-top:6px;"><div class="fe-cat-name" style="font-weight:700;">TOTAL VARIABLE</div><div class="fe-cat-val" style="color:var(--crimson);font-size:14px;">S/${totalEgreso.toFixed(2)}</div></div>`:''}
    </div>
    <div class="fe-summary">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-family:var(--fm);font-size:11px;color:var(--m2);">💰 LO QUE TE SOBRA ESTE MES</div>
        <div style="font-family:var(--fd);font-size:22px;font-weight:700;color:${netto>=0?'var(--jade)':'var(--crimson)'};">${netto>=0?'+':''}S/${netto.toFixed(2)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border);">
        <div style="font-family:var(--fm);font-size:10px;color:var(--m2);">Tasa de ahorro</div>
        <div style="font-family:var(--fd);font-size:14px;color:${savingRate>=35?'var(--jade)':savingRate>=20?'var(--gold)':'var(--crimson)'};font-weight:700;">${savingRate}%</div>
      </div>
    </div>
    <div class="fe-advice">${advice}</div>
    <div class="fe-section" style="margin-top:16px;">
      <div class="fe-section-title">🎯 Distribución sugerida de lo que sobra</div>
      ${netto>0?`
        <div class="fe-category"><div class="fe-cat-name">70% → ETF VOO (inversión)</div><div class="fe-cat-val" style="color:var(--jade)">S/${(netto*0.7).toFixed(0)}</div></div>
        <div class="fe-category"><div class="fe-cat-name">20% → Fondo hacienda 2028</div><div class="fe-cat-val" style="color:var(--gold)">S/${(netto*0.2).toFixed(0)}</div></div>
        <div class="fe-category"><div class="fe-cat-name">10% → Caprichos / viajes</div><div class="fe-cat-val" style="color:var(--violet)">S/${(netto*0.1).toFixed(0)}</div></div>
      `:'<div style="font-family:var(--fm);font-size:10px;color:var(--crimson);padding:6px 0;">Reducí gastos antes de poder distribuir excedente.</div>'}
    </div>`;
}
function changeFinanceMonth(m){
  ST.currentFinanceMonth=m;
  renderFinanceExpert();
  saveAll();
}

// ═══════════════════════════════════════════════════
// AI RECEIPT + GITHUB (same as v4)
// ═══════════════════════════════════════════════════
function saveGHConfig(){
  ST.ghConfig={
    token:document.getElementById('ghToken').value.trim(),
    user:document.getElementById('ghUser').value.trim(),
    repo:document.getElementById('ghRepo').value.trim()
  };
  saveAll();cm('mGH');alert('✅ GitHub configurado.');
}
async function uploadToGitHub(filename,content,isBase64=false){
  const {token,user,repo}=ST.ghConfig;
  if(!token||!user||!repo)return {ok:false};
  const url=`https://api.github.com/repos/${user}/${repo}/contents/${filename}`;
  const body={message:`Auto-upload: ${filename}`,content:isBase64?content:btoa(unescape(encodeURIComponent(content)))};
  try{
    const r=await fetch(url,{method:'PUT',headers:{'Authorization':`token ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
    return {ok:r.ok,status:r.status};
  }catch(e){return {ok:false,msg:e.message};}
}
function setGHStep(stepId,state){const el=document.getElementById(stepId);if(!el)return;el.className='gh-step '+state;}

async function analyzeReceiptWithAI(imageDataUrl){
  document.getElementById('aiLoad').style.display='block';
  document.getElementById('aiResult').style.display='none';
  let dots=0;
  const di=setInterval(()=>{dots=(dots+1)%4;const e=document.getElementById('aiDots');if(e)e.textContent='.'.repeat(dots+1);},400);
  try{
    const base64=imageDataUrl.split(',')[1];
    const mediaType=imageDataUrl.split(';')[0].split(':')[1];
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,
        messages:[{role:'user',content:[
          {type:'image',source:{type:'base64',media_type:mediaType,data:base64}},
          {type:'text',text:`Analizá esta boleta. JSON exacto: {"tipo":"egreso|ingreso","descripcion":"nombre","monto":número,"fecha":"DD/MM/YYYY","categoria":"hormiga|comida|transporte|salud|entretenimiento|educacion|ropa|servicios|trabajo|pasivo|otro","confianza":"alta|media|baja"}`}]}]})
    });
    clearInterval(di);
    const data=await resp.json();
    const txt=data.content?.[0]?.text||'{}';
    let result;
    try{result=JSON.parse(txt.replace(/```json|```/g,'').trim());}
    catch(e){result={tipo:'egreso',descripcion:'No detectado',monto:0,fecha:'—',categoria:'otro',confianza:'baja'};}
    ST.currentReceipt=result;
    ST.currentReceiptB64=base64;
    document.getElementById('arTipo').textContent=result.tipo==='ingreso'?'✅ INGRESO':'❌ EGRESO';
    document.getElementById('arTipo').style.color=result.tipo==='ingreso'?'var(--jade)':'var(--crimson)';
    document.getElementById('arDesc').textContent=result.descripcion||'—';
    document.getElementById('arMonto').textContent='S/'+(parseFloat(result.monto)||0).toFixed(2);
    document.getElementById('arMonto').style.color=result.tipo==='ingreso'?'var(--jade)':'var(--crimson)';
    document.getElementById('arFecha').textContent=result.fecha||'—';
    document.getElementById('arCat').textContent=(result.categoria||'otro').toUpperCase();
    document.getElementById('aiLoad').style.display='none';
    document.getElementById('aiResult').style.display='block';
  }catch(err){
    clearInterval(di);
    document.getElementById('aiLoad').style.display='none';
    alert('Error. Verificá tu conexión.');
  }
}
async function confirmReceipt(){
  if(!ST.currentReceipt)return;
  const r=ST.currentReceipt;
  if(!ST.gastos)ST.gastos=[];
  if(!ST.boletas)ST.boletas=[];
  const entry={id:'b_'+Date.now(),tipo:r.tipo,cat:r.categoria,desc:r.descripcion,monto:parseFloat(r.monto||0),fecha:r.fecha,source:'boleta_ia',scan_date:new Date().toLocaleDateString('es-PE')};
  ST.gastos.unshift(entry);
  ST.boletas.unshift(entry);
  document.getElementById('aiResult').style.display='none';
  const {token,user,repo}=ST.ghConfig;
  if(token&&user&&repo&&ST.currentReceiptB64){
    const ghDiv=document.getElementById('ghStatus');
    if(ghDiv){
      ghDiv.style.display='block';
      ['ghs1','ghs2','ghs3','ghs4'].forEach(id=>setGHStep(id,''));
      setGHStep('ghs1','active');
      await new Promise(r=>setTimeout(r,300));
      setGHStep('ghs1','done');setGHStep('ghs2','active');
      const month=new Date().toISOString().slice(0,7);
      const filename=`boletas/${month}/${Date.now()}_${(r.descripcion||'b').replace(/[^a-zA-Z0-9]/g,'_')}.jpg`;
      await new Promise(r=>setTimeout(r,300));
      setGHStep('ghs2','done');setGHStep('ghs3','active');
      const result=await uploadToGitHub(filename,ST.currentReceiptB64,true);
      if(result.ok){setGHStep('ghs3','done');setGHStep('ghs4','done');entry.github_path=filename;}
      else{setGHStep('ghs3','error');setGHStep('ghs4','active');}
      setTimeout(()=>{ghDiv.style.display='none';},3500);
    }
  }
  ST.currentReceipt=null;ST.currentReceiptB64=null;
  document.getElementById('receiptFile').value='';
  renderGastos();renderBoletasList();renderFinanceExpert();saveAll();
}
function cancelReceipt(){
  ST.currentReceipt=null;ST.currentReceiptB64=null;
  document.getElementById('aiResult').style.display='none';
  document.getElementById('receiptFile').value='';
}
function dropReceipt(e){
  e.preventDefault();document.getElementById('scanZone').classList.remove('drag');
  const f=e.dataTransfer.files[0];
  if(f&&f.type.startsWith('image/')){const r=new FileReader();r.onload=ev=>analyzeReceiptWithAI(ev.target.result);r.readAsDataURL(f);}
}
function scanReceipt(e){
  const f=e.target.files[0];
  if(f){const r=new FileReader();r.onload=ev=>analyzeReceiptWithAI(ev.target.result);r.readAsDataURL(f);}
}
function renderBoletasList(){
  const d=document.getElementById('boletasList');if(!d)return;
  const bs=ST.boletas||[];
  d.innerHTML=bs.length?bs.slice(0,15).map(b=>`
    <div class="logi" style="border-left-color:${b.tipo==='ingreso'?'var(--jade)':'var(--crimson)'}">
      <div><div class="lt">${b.desc} 🤖${b.github_path?' <span style="color:var(--jade);font-size:8px;">📁 GH</span>':''}</div>
      <div class="lm">${b.cat?.toUpperCase()||'—'} · ${b.scan_date||b.fecha}</div></div>
      <div class="ld" style="color:${b.tipo==='ingreso'?'var(--jade)':'var(--crimson)'}">
        ${b.tipo==='ingreso'?'+':'−'}S/${b.monto.toFixed(2)}</div></div>`).join('')
    :'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);">Sin boletas.</div>';
}

// ═══════════════════════════════════════════════════
// MILESTONES / SKILLS / NOTES
// ═══════════════════════════════════════════════════
function renderMilestones(){
  const bl=document.getElementById('msBlock');if(!bl)return;
  bl.innerHTML='';
  MILESTONES_DEF.forEach((ms,i)=>{
    const d=ST.milestones?.[ms.id]||{status:ms.status,pct:ms.pct};
    const st=d.status,pct=d.pct,isLast=i===MILESTONES_DEF.length-1;
    const div=document.createElement('div');div.className='ms-row';
    div.innerHTML=`<div class="ms-when">${ms.when}</div>
      <div class="ms-spine"><div class="ms-node ${st}" onclick="cycMs('${ms.id}')"></div>${!isLast?`<div class="ms-wire ${st==='done'?'done':'soon'}"></div>`:''}</div>
      <div class="ms-body ${st}" onclick="cycMs('${ms.id}')">
        <div class="ms-head"><div class="ms-ttl">${ms.title}</div>
          <span class="ms-badge ${st==='done'?'bd-done':st==='now'?'bd-now':'bd-soon'}">${st==='done'?'HECHO':st==='now'?'EN CURSO':'PENDIENTE'}</span></div>
        <div class="ms-desc">${ms.desc}</div>
        <div class="pct-row">
          <div class="pct-bar"><div class="pct-fill" id="pf_${ms.id}" style="width:${pct}%"></div></div>
          <input type="range" min="0" max="100" value="${pct}" style="width:60px;height:3px;cursor:pointer;accent-color:var(--gold);" oninput="updP('${ms.id}',this.value)" onclick="event.stopPropagation()">
          <div class="pct-lbl" id="pl_${ms.id}">${pct}%</div>
        </div></div>`;
    bl.appendChild(div);
  });
}
function cycMs(id){
  const d=ST.milestones?.[id]||{status:'soon',pct:0};
  d.status=d.status==='soon'?'now':d.status==='now'?'done':'soon';
  if(!ST.milestones)ST.milestones={};
  ST.milestones[id]=d;renderMilestones();saveAll();
}
function updP(id,val){
  if(!ST.milestones)ST.milestones={};
  if(!ST.milestones[id])ST.milestones[id]={status:'soon',pct:0};
  ST.milestones[id].pct=parseInt(val);
  const pf=document.getElementById('pf_'+id),pl=document.getElementById('pl_'+id);
  if(pf)pf.style.width=val+'%';if(pl)pl.textContent=val+'%';saveAll();
}
function renderSkills(){
  const bl=document.getElementById('skillsBlock');if(!bl)return;
  bl.innerHTML='';
  SKILLS_DEF.forEach(sk=>{
    const val=ST.skills?.[sk.id]!==undefined?ST.skills[sk.id]:sk.base;
    const r=document.createElement('div');r.className='prow';
    r.innerHTML=`<div class="pname">${sk.name}</div>
      <div class="ptrack"><div class="pfill" id="sf_${sk.id}" style="width:${val}%;background:${sk.c}"></div></div>
      <input type="range" min="0" max="100" value="${val}" style="width:60px;height:3px;cursor:pointer;accent-color:var(--gold);" oninput="updSk('${sk.id}',this.value)">
      <div class="ppct" id="sp_${sk.id}">${val}%</div>`;
    bl.appendChild(r);
  });
}
function updSk(id,val){
  if(!ST.skills)ST.skills={};ST.skills[id]=parseInt(val);
  const sf=document.getElementById('sf_'+id),sp=document.getElementById('sp_'+id);
  if(sf)sf.style.width=val+'%';if(sp)sp.textContent=val+'%';saveAll();
}
function addNote(){
  const txt=document.getElementById('noteInput').value.trim();if(!txt)return;
  const tag=document.getElementById('noteTag').value;
  if(!ST.notes)ST.notes=[];
  ST.notes.unshift({date:new Date().toLocaleString('es-PE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),text:txt,tag});
  if(ST.notes.length>100)ST.notes.pop();
  document.getElementById('noteInput').value='';
  renderNotes();saveAll();
}
function renderNotes(){
  const d=document.getElementById('notesList');if(!d)return;
  const n=ST.notes||[];
  d.innerHTML=n.length?n.map(nt=>`
    <div class="logi" style="border-left-color:${TAG_COLORS[nt.tag]||'var(--jade)'}">
      <div><div class="lt">${nt.text}</div><div class="lm" style="color:${TAG_COLORS[nt.tag]||'var(--m2)'}">${nt.tag.toUpperCase()}</div></div>
      <div class="ld">${nt.date}</div></div>`).join('')
    :'<div style="font-family:var(--fm);font-size:10px;color:var(--m2);">Sin notas.</div>';
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
function renderAll(){
  renderPhrase(document.getElementById('homePhrase'),false);
  renderPhrasePage();
  renderHabits();
  renderPlanner();
  renderPosts();
  renderMeals();
  renderExercises();
  renderMeasures();
  renderMilestones();
  renderSkills();
  renderGastos();
  renderBoletasList();
  renderFinanceExpert();
  renderNotes();
  updateLastUpd();
  // Populate owner select in post modal
  const pOwner=document.getElementById('pOwner');
  if(pOwner&&!pOwner.dataset.done){
    pOwner.innerHTML=OWNERS.map(o=>`<option value="${o.id}">${o.icon} ${o.name}</option>`).join('');
    pOwner.dataset.done='1';
  }
  // Populate owner filter tabs
  const ot=document.getElementById('ownerTabs');
  if(ot&&!ot.dataset.done){
    ot.innerHTML=`<div class="otab active" onclick="setOwnerFilter('all',this)">📋 Todos</div>`+
      OWNERS.map(o=>`<div class="otab" onclick="setOwnerFilter('${o.id}',this)" style="--own:${o.color}">${o.icon} ${o.name.split('·')[0].trim()}</div>`).join('');
    ot.dataset.done='1';
  }
  // Pre-fill GitHub config
  if(ST.ghConfig){
    const t=document.getElementById('ghToken'),u=document.getElementById('ghUser'),r=document.getElementById('ghRepo');
    if(t&&ST.ghConfig.token)t.value=ST.ghConfig.token;
    if(u&&ST.ghConfig.user)u.value=ST.ghConfig.user;
    if(r&&ST.ghConfig.repo)r.value=ST.ghConfig.repo;
  }
  // Live date
  const ld=document.getElementById('liveDate');
  if(ld)ld.textContent=new Date().toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}

function init(){
  initDragonCursor();
  initModals();
  loadAll();
  renderAll();
}

document.addEventListener('DOMContentLoaded',init);
