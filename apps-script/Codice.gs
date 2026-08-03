/******************************************************************
 *  PALESTRINA — backend + frontend serviti da Google Apps Script
 *  (HtmlService). L'app e i dati vivono nello stesso Foglio/Progetto:
 *  niente hosting esterno, niente token nel client.
 *
 *  Deploy: Distribuisci → App web → Esegui come: Io ·
 *          Chi ha accesso: Solo io.
 *  Il client parla col server via google.script.run (same-origin).
 ******************************************************************/

/* Colonne (chiavi esercizio) per la copia leggibile nel foglio "Sessioni". */
const COLS = ["bench","fly","lat","uprow","frontdelt","latraise","reardelt",
              "curlStd","curlSeat","tricep","abcrunch","oblique","plank","crunchRev"];

/* ---- serve l'app ---- */
function doGet(){
  return HtmlService.createTemplateFromFile("index").evaluate()
    .setTitle("Palestrina")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover");
}

/* Inietta un altro file (es. il programma) dentro l'HTML via <?!= include('program') ?> */
function include(name){
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/* ---- API chiamate dal client (google.script.run) ---- */
function getState(){
  return readDB();
}
function saveState(payload){
  var p = { sessions: (payload && payload.sessions) || [],
            measures: (payload && payload.measures) || [] };
  writeDB(p);
  mirror(p);
  return { ok:true };
}

/* ---- helper foglio ---- */
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
