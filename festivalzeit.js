"use strict";
// Festivalzeit ist absichtlich eine separate Datensammlung.
// Die Essen-Tracker-Sicherung in index.html nimmt sie zusätzlich auf.
const FESTIVAL_KEY="sfoFestivalzeit.v1";
const CATEGORIES=[
  ["grafik","Grafikdesign"],
  ["fotobox","Fotobox"],
  ["app","App-Entwicklung"],
  ["tickets","Tickets & Verkauf"],
  ["orga","Organisation"],
  ["kommunikation","E-Mails & Kommunikation"],
  ["meeting","Besprechungen"],
  ["sonstiges","Sonstiges"]
];
const categoryLabel=id=>CATEGORIES.find(c=>c[0]===id)?.[1]||"Sonstiges";
const categoryId=id=>CATEGORIES.some(c=>c[0]===id)?id:"sonstiges";
const $=id=>document.getElementById(id);
const fresh=()=>({version:1,entries:[],active:null});
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(FESTIVAL_KEY));
    if(!raw||!Array.isArray(raw.entries))return fresh();
    return {version:1,entries:raw.entries.filter(e=>e&&typeof e.id==="string"&&Number.isFinite(e.durationMs)&&e.durationMs>0&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)).map(e=>({...e,category:categoryId(e.category)})),active:raw.active&&typeof raw.active==="object"?raw.active:null};
  }catch(_){return fresh()}
}
let data=load(),editId=null;
const uid=()=>"f"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
function localDay(date=new Date()){
  const d=new Date(date);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function monday(date=new Date()){
  const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return localDay(d);
}
function hhmm(ms){const min=Math.floor(Math.max(0,ms)/60000);return Math.floor(min/60)+":"+String(min%60).padStart(2,"0")}
function clock(ms){const s=Math.floor(Math.max(0,ms)/1000);return String(Math.floor(s/3600)).padStart(2,"0")+":"+String(Math.floor(s/60)%60).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function formatDate(str){const [y,m,d]=str.split("-");return d+"."+m+"."+y}
function notify(message,error=false){const e=$("notice");e.textContent=message;e.classList.toggle("error",error);e.hidden=false;}
function persist(){
  try{localStorage.setItem(FESTIVAL_KEY,JSON.stringify(data));return true}
  catch(_){notify("Speichern fehlgeschlagen. Bitte Browser-Speicher prüfen und die Daten sichern.",true);return false}
}
function liveMs(){const a=data.active;if(!a)return 0;return Math.max(0,a.elapsedMs||0)+(a.segmentAt?Math.max(0,Date.now()-Date.parse(a.segmentAt)):0)}
function syncTimer(){
  const a=data.active;
  $("timerClock").textContent=clock(liveMs());
  $("timerBadge").textContent=!a?"Bereit":a.segmentAt?"Läuft":"Pausiert";
  $("timerState").textContent=!a?"Noch kein Timer gestartet.":a.segmentAt?"Erfassung läuft – auch beim Schließen der App.":"Die Zeit ist pausiert.";
  $("startBtn").textContent=!a?"▶ Starten":a.segmentAt?"▶ Läuft":"▶ Fortsetzen";
  $("startBtn").disabled=!!a?.segmentAt;
  $("pauseBtn").disabled=!a?.segmentAt;
  $("stopBtn").disabled=!a;
}
function start(){
  if(!data.active){data.active={startedAt:new Date().toISOString(),segmentAt:new Date().toISOString(),elapsedMs:0,category:categoryId($("timerCategory").value),note:$("timerNote").value.trim()};}
  else if(!data.active.segmentAt){data.active.segmentAt=new Date().toISOString()}
  if(persist())syncTimer();
}
function pause(){const a=data.active;if(!a?.segmentAt)return;a.elapsedMs=liveMs();a.segmentAt=null;persist();syncTimer();render();}
function stop(){
  const a=data.active;if(!a)return;
  const duration=Math.round(liveMs()/1000)*1000;
  if(duration<1000){notify("Bitte mindestens eine Sekunde erfassen.",true);return;}
  data.entries.push({id:uid(),date:localDay(a.startedAt),category:categoryId($("timerCategory").value),note:$("timerNote").value.trim(),durationMs:duration,source:"timer",estimated:false,startedAt:a.startedAt,endedAt:new Date().toISOString()});
  data.active=null;$("timerNote").value="";
  if(persist()){notify("Festivalzeit gespeichert: "+hhmm(duration)+" Stunden.");render()}
}
function populateCategories(select){for(const [id,label] of CATEGORIES){const opt=document.createElement("option");opt.value=id;opt.textContent=label;select.append(opt)}}
function addStat(parent,label,ms,max){
  const row=document.createElement("div");row.className="progress-line";
  const name=document.createElement("span");name.textContent=label;
  const bar=document.createElement("div");bar.className="track";const fill=document.createElement("div");fill.className="fill";fill.style.width=(max?Math.max(0,100*ms/max):0)+"%";bar.append(fill);
  const value=document.createElement("strong");value.textContent=hhmm(ms)+" h";
  row.append(name,bar,value);parent.append(row);
}
function renderStats(){
  const today=localDay(),week=monday(),month=today.slice(0,7);
  const sum=predicate=>data.entries.filter(predicate).reduce((s,e)=>s+e.durationMs,0);
  $("statToday").textContent=hhmm(sum(e=>e.date===today));
  $("statWeek").textContent=hhmm(sum(e=>e.date>=week&&e.date<=today));
  $("statMonth").textContent=hhmm(sum(e=>e.date.startsWith(month)));
  $("statAll").textContent=hhmm(sum(()=>true));
  const stats=$("categoryStats");stats.replaceChildren();
  const totals=CATEGORIES.map(([id,label])=>({id,label,ms:sum(e=>e.category===id)})).filter(e=>e.ms>0).sort((a,b)=>b.ms-a.ms);
  if(!totals.length){stats.textContent="Noch keine abgeschlossenen Einträge.";return}
  for(const x of totals)addStat(stats,x.label,x.ms,totals[0].ms);
}
function renderHistory(){
  const parent=$("entryList");parent.replaceChildren();
  const today=localDay(),filter=$("historyFilter").value;
  const entries=[...data.entries].filter(e=>filter==="all"||filter==="month"&&e.date.startsWith(today.slice(0,7))||filter==="week"&&e.date>=monday()&&e.date<=today).sort((a,b)=>b.date.localeCompare(a.date)||(b.startedAt||"").localeCompare(a.startedAt||""));
  if(!entries.length){const e=document.createElement("div");e.className="empty";e.textContent="Noch keine Einträge für diesen Zeitraum.";parent.append(e);return}
  for(const entry of entries){
    const row=document.createElement("div");row.className="entry";
    const head=document.createElement("div");head.className="entry-header";
    const main=document.createElement("div");main.className="entry-main";
    const title=document.createElement("strong");title.textContent=categoryLabel(entry.category);
    const meta=document.createElement("div");meta.className="entry-meta";
    const label=entry.estimated?"geschätzt":entry.source==="timer"?"Timer":entry.source==="korrigiert"?"bearbeitet":"manuell";
    meta.textContent=formatDate(entry.date)+" · "+label;
    const dur=document.createElement("span");dur.className="entry-duration";dur.textContent=hhmm(entry.durationMs)+" h";
    main.append(title,meta);head.append(main,dur);row.append(head);
    if(entry.note){const note=document.createElement("div");note.className="entry-note";note.textContent=entry.note;row.append(note)}
    const actions=document.createElement("div");actions.className="entry-actions";
    const edit=document.createElement("button");edit.type="button";edit.textContent="Bearbeiten";edit.onclick=()=>openManual(entry.id);
    const del=document.createElement("button");del.type="button";del.textContent="Löschen";del.onclick=()=>{
      if(!confirm("Diesen Festivalzeit-Eintrag wirklich löschen?"))return;
      data.entries=data.entries.filter(e=>e.id!==entry.id);persist();render();notify("Eintrag gelöscht.");
    };
    actions.append(edit,del);row.append(actions);parent.append(row);
  }
}
function render(){renderStats();renderHistory();syncTimer()}
function openManual(id=null){
  editId=id;
  const entry=data.entries.find(e=>e.id===id);
  $("manualTitle").textContent=entry?"Zeit bearbeiten":"Zeit nachtragen";
  $("manualDate").value=entry?.date||localDay();
  $("manualCategory").value=entry?.category||"orga";
  const mins=Math.round((entry?.durationMs||3600000)/60000);
  $("manualHours").value=Math.floor(mins/60);
  $("manualMinutes").value=mins%60;
  $("manualNote").value=entry?.note||"";
  $("manualEstimated").checked=entry?!!entry.estimated:true;
  $("manualDialog").showModal();
}
function saveManual(ev){
  ev.preventDefault();
  const date=$("manualDate").value,hr=Number($("manualHours").value),min=Number($("manualMinutes").value);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(hr)||!Number.isInteger(min)||hr<0||hr>48||min<0||min>59||hr*60+min<=0){notify("Bitte gültiges Datum und eine Dauer über 0 Minuten eingeben.",true);return}
  const record={date,category:categoryId($("manualCategory").value),note:$("manualNote").value.trim(),durationMs:(hr*60+min)*60000,estimated:$("manualEstimated").checked};
  const target=data.entries.find(e=>e.id===editId);
  if(target){Object.assign(target,record,{source:"korrigiert"});delete target.startedAt;delete target.endedAt}
  else data.entries.push({id:uid(),...record,source:"manuell"});
  if(persist()){$("manualDialog").close();render();notify("Arbeitszeit gespeichert.")}
}
function download(name,content,mime){
  const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function exportCsv(){
  const clean=s=>'"'+String(s??"").replaceAll('"','""').replace(/^[=+@\-\t\r]/,'\u200b$&')+'"';
  const lines=[["Datum","Tätigkeit","Stunden","Minuten gesamt","Quelle","Geschätzt","Notiz"].map(clean).join(";")];
  for(const e of [...data.entries].sort((a,b)=>a.date.localeCompare(b.date))){
    const dec=(e.durationMs/3600000).toFixed(2).replace(".",",");
    lines.push([e.date,categoryLabel(e.category),dec,Math.round(e.durationMs/60000),e.source||"manuell",e.estimated?"Ja":"Nein",e.note||""].map(clean).join(";"));
  }
  download("SFO-Festivalzeit-"+localDay()+".csv","\ufeff"+lines.join("\r\n"),"text/csv;charset=utf-8");
}
function exportJson(){download("SFO-Festivalzeit-"+localDay()+".json",JSON.stringify(data,null,2),"application/json")}
async function importJson(file){
  try{
    const payload=JSON.parse(await file.text());
    const imported=payload?.festivalTime??payload;
    if(!Array.isArray(imported?.entries))throw new Error("Keine Festivalzeit-Sicherung");
    const valid=imported.entries.filter(e=>e&&typeof e.id==="string"&&Number.isFinite(e.durationMs)&&e.durationMs>0&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&e.durationMs<172800000).map(e=>({...e,category:categoryId(e.category)}));
    if(!confirm(valid.length+" Festivalzeit-Einträge importieren? Gleichnamige Einträge werden aktualisiert. Ein laufender Timer bleibt erhalten."))return;
    const ids=new Map(data.entries.map(e=>[e.id,e]));for(const e of valid)ids.set(e.id,e);
    data.entries=[...ids.values()];
    if(persist()){render();notify(valid.length+" Einträge eingelesen.")}
  }catch(_){notify("Die ausgewählte Datei enthält keine gültige Festivalzeit-Sicherung.",true)}
}
for(const id of ["timerCategory","manualCategory"])populateCategories($(id));
$("timerCategory").value=data.active?.category||"orga";
$("timerNote").value=data.active?.note||"";
$("timerCategory").addEventListener("change",()=>{if(data.active){data.active.category=categoryId($("timerCategory").value);persist()}});
$("timerNote").addEventListener("change",()=>{if(data.active){data.active.note=$("timerNote").value.trim();persist()}});
$("startBtn").addEventListener("click",start);
$("pauseBtn").addEventListener("click",pause);
$("stopBtn").addEventListener("click",stop);
$("newManualBtn").addEventListener("click",()=>openManual());
$("manualCancel").addEventListener("click",()=>$("manualDialog").close());
$("manualForm").addEventListener("submit",saveManual);
$("historyFilter").addEventListener("change",renderHistory);
$("csvExport").addEventListener("click",exportCsv);
$("jsonExport").addEventListener("click",exportJson);
$("jsonImportButton").addEventListener("click",()=>$("jsonImport").click());
$("jsonImport").addEventListener("change",async ev=>{if(ev.target.files?.[0])await importJson(ev.target.files[0]);ev.target.value=""});
window.addEventListener("storage",ev=>{if(ev.key===FESTIVAL_KEY){data=load();$("timerCategory").value=data.active?.category||"orga";$("timerNote").value=data.active?.note||"";render()}});
render();setInterval(syncTimer,1000);
