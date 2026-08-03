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
  var data;
  try { data = JSON.parse((e.postData && e.postData.contents) || "{}"); }
  catch(err){ return json({error:"bad json"}); }
  var payload = { sessions: data.sessions || [], measures: data.measures || [] };
  writeDB(payload);
  mirror(payload);
  return json({ok:true});
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
  var mh = ["data","peso","grasso%","girovita_cm"];
  m.getRange(1,1,1,mh.length).setValues([mh]);
  var mr = (p.measures||[]).map(function(x){
    return [x.date, x.weight, x.fat!=null?x.fat:"", x.waist!=null?x.waist:""];
  });
  if(mr.length) m.getRange(2,1,mr.length,mh.length).setValues(mr);
}
