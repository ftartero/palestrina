/******************************************************************
 *  PALESTRINA — backend (Google Apps Script) come API JSON
 *  Il frontend (PWA su GitHub Pages) chiama:
 *    GET  ?token=…                → { sessions, measures }
 *    POST body=JSON (text/plain)  → salva tutto lo stato, { ok:true }
 *  I dati vivono nel Foglio: DB!A1 = JSON autorevole; fogli
 *  "Sessioni"/"Misure" = copia leggibile.
 *
 *  SICUREZZA: il token NON è nel codice (repo pubblico). Va messo in
 *  Impostazioni progetto → Proprietà script → chiave "SECRET".
 *  Deploy: App web · Esegui come: Io · Chi ha accesso: Chiunque.
 ******************************************************************/

const COLS = ["bench","fly","lat","uprow","frontdelt","latraise","reardelt",
              "curlStd","curlSeat","tricep","abcrunch","oblique","plank","crunchRev"];

function doGet(e){
  if(!authorized(e)) return json({error:"unauthorized"});
  return json(readDB());
}

function doPost(e){
  if(!authorized(e)) return json({error:"unauthorized"});
  // azione "addMeasure": inserisce/aggiorna UNA misura (usata dallo Shortcut iOS / Garmin)
  if(e && e.parameter && e.parameter.action === "addMeasure") return addMeasure(e);
  // default: salva TUTTO lo stato
  var data;
  try { data = JSON.parse((e.postData && e.postData.contents) || "{}"); }
  catch(err){ return json({error:"bad json"}); }
  var payload = { sessions: data.sessions || [], measures: data.measures || [] };
  writeDB(payload);
  mirror(payload);
  return json({ok:true});
}

/* Inserisce o aggiorna una singola misura (dedup per data). Il peso è
   obbligatorio; grasso/girovita opzionali. Se la misura del giorno esiste già
   e il nuovo dato non porta il girovita, quello esistente (manuale) si mantiene. */
function addMeasure(e){
  var m;
  try { m = JSON.parse((e.postData && e.postData.contents) || "{}"); }
  catch(err){ return json({error:"bad json"}); }
  if(m.weight == null || m.weight === "" || isNaN(Number(m.weight))) return json({error:"weight required"});
  var db = readDB();
  var measures = db.measures || [];
  var date = m.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var idx = -1;
  for(var i=0;i<measures.length;i++){ if(measures[i].date === date){ idx = i; break; } }
  var base = (idx >= 0) ? measures[idx] : {};
  // merge: il nuovo valore vince se presente, altrimenti si tiene l'esistente
  // (così il girovita manuale e i dati corporei si conservano tra un invio e l'altro)
  function pick(nv, ov){ return (nv == null || nv === "" || isNaN(Number(nv))) ? (ov == null ? null : ov) : Number(nv); }
  var rec = {
    id: base.id || Number(m.id) || (new Date().getTime()),
    date: date,
    weight: Number(m.weight),
    fat:          pick(m.fat,          base.fat),
    waist:        pick(m.waist,        base.waist),
    muscle:       pick(m.muscle,       base.muscle),
    water:        pick(m.water,        base.water),
    bone:         pick(m.bone,         base.bone),
    visceral:     pick(m.visceral,     base.visceral),
    metabolicAge: pick(m.metabolicAge, base.metabolicAge)
  };
  if(idx >= 0) measures[idx] = rec; else measures.push(rec);
  measures.sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
  var payload = { sessions: db.sessions || [], measures: measures };
  writeDB(payload);
  mirror(payload);
  return json({ok:true, measure:rec});
}

/* ---- auth: token dalla proprietà di script "SECRET" ---- */
function authorized(e){
  var secret = PropertiesService.getScriptProperties().getProperty("SECRET");
  return !!secret && e && e.parameter && e.parameter.token === secret;
}
function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
function sheet(name){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

/* ---- fonte autorevole: JSON nel foglio "DB", cella A1 ---- */
function readDB(){
  var v = sheet("DB").getRange("A1").getValue();
  if(!v) return {sessions:[], measures:[]};
  try { return JSON.parse(v); } catch(err){ return {sessions:[], measures:[]}; }
}
function writeDB(p){ sheet("DB").getRange("A1").setValue(JSON.stringify(p)); }

/* ---- copia leggibile nei fogli "Sessioni" e "Misure" ---- */
function mirror(p){
  var s = sheet("Sessioni");
  s.clearContents();
  var header = ["data","scheda"].concat(COLS).concat(["nota"]);
  s.getRange(1,1,1,header.length).setValues([header]);
  var rows = (p.sessions||[]).map(function(x){
    return [x.date, x.type]
      .concat(COLS.map(function(k){ return (x.entries && x.entries[k]!=null) ? x.entries[k] : ""; }))
      .concat([x.note||""]);
  });
  if(rows.length) s.getRange(2,1,rows.length,header.length).setValues(rows);

  var m = sheet("Misure");
  m.clearContents();
  var mh = ["data","peso","grasso%","girovita_cm","muscolo_kg","acqua%","ossa_kg","viscerale","eta_metab"];
  m.getRange(1,1,1,mh.length).setValues([mh]);
  var mv = function(v){ return v!=null ? v : ""; };
  var mr = (p.measures||[]).map(function(x){
    return [x.date, x.weight, mv(x.fat), mv(x.waist), mv(x.muscle), mv(x.water), mv(x.bone), mv(x.visceral), mv(x.metabolicAge)];
  });
  if(mr.length) m.getRange(2,1,mr.length,mh.length).setValues(mr);
}
