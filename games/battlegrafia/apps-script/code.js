// --- SISTEMA DE ARRANQUE ---
function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Battlegrafía - Gremio de Aventureros')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- GUARDADO CORREGIDO ---
function guardarProgreso(email, slot, oro, nivel, xp, dataStr, when) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Guardados") || ss.insertSheet("Guardados");
    const dataRows = sheet.getDataRange().getValues();
    let filaDestino = -1;

    // Buscamos la fila correcta por Email y Slot
    for (let i = 1; i < dataRows.length; i++) {
      if (dataRows[i][0] === email && dataRows[i][1] === slot) {
        filaDestino = i + 1;
        break;
      }
    }

    let p = JSON.parse(dataStr);
    const nombreHeroe = p.name || "Aventurero";
    const monstruos = p.monstersDefeated || 0;

    // Mantenemos el orden exacto de tu CSV: A:Email, B:Slot, C:Nombre, D:Nivel, E:XP, F:Oro, G:Monst, H:JSON, I:Fecha
    const valores = [email, slot, nombreHeroe, nivel, xp, oro, monstruos, dataStr, when];

    if (filaDestino !== -1) {
      sheet.getRange(filaDestino, 1, 1, 9).setValues([valores]);
    } else {
      sheet.appendRow(valores);
    }

    actualizarHojaEvaluacion(email, p);
    return "OK_GUARDADO";
  } catch (e) {
    return "Error: " + e.toString();
  }
}

// --- CARGA INTELIGENTE (SINCRONIZACIÓN SEGURA) ---
function cargarProgreso(email, slot) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Guardados");
  if(!sheet) return null;
  const data = sheet.getDataRange().getValues();
  
  for(let i=1; i<data.length; i++){
    if(data[i][0] == email && data[i][1] == slot) {
      let dataStr = data[i][7]; // Columna H (JSON completo)
      if (!dataStr) return null;
      
      let p = JSON.parse(dataStr);

      // --- SINCRONIZACIÓN BIDI: Solo si el Excel tiene valores mayores que 0 ---
      // Esto evita que celdas vacías borren el progreso del alumno
      let excelNivel = Number(data[i][3]);
      let excelXP = Number(data[i][4]);
      let excelOro = Number(data[i][5]);
      let excelMonst = Number(data[i][6]);

      if (excelNivel > 0) p.level = excelNivel;
      if (excelXP > 0) p.xp = excelXP;
      if (excelOro >= 0 && data[i][5] !== "") p.gold = excelOro;
      if (excelMonst > 0) p.monstersDefeated = excelMonst;
      
      // El inventario (p.items) nunca se toca desde aquí, se queda como estaba en el JSON
      return JSON.stringify(p);
    }
  }
  return null;
}

// --- EVALUACIÓN ---
function actualizarHojaEvaluacion(email, p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetEval = ss.getSheetByName("Evaluacion") || ss.insertSheet("Evaluacion");
  
  const aciertos = Number(p.stats_correct) || 0;
  const errores = Number(p.stats_wrong) || 0;
  const totales = aciertos + errores;
  const porcentaje = totales > 0 ? (aciertos / totales) : 0;
  let notaFinal = ((porcentaje * 7) + (Math.min(totales / 50, 1) * 3)).toFixed(2);

  const rowsEval = sheetEval.getDataRange().getValues();
  let filaEval = -1;
  for (let j = 1; j < rowsEval.length; j++) {
    if (rowsEval[j][0] === email) { filaEval = j + 1; break; }
  }

  const datosRow = [
    email, p.name || "Aventurero", aciertos, errores, totales, 
    (porcentaje * 100).toFixed(1) + "%", p.monstersDefeated || 0, p.deaths || 0, 
    notaFinal, new Date().toLocaleString("es-ES")
  ];

  if (filaEval !== -1) sheetEval.getRange(filaEval, 1, 1, 10).setValues([datosRow]);
  else sheetEval.appendRow(datosRow);
}

// --- LOGIN ---
function verificarCredenciales(email, pin) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Guardados") || ss.insertSheet("Guardados");
  const data = sheet.getDataRange().getValues();
  for(let i = 1; i < data.length; i++) {
    if(data[i][0] == email && data[i][1] == "CREDENCIALES") {
      return (data[i][2].toString() === pin.toString()) ? "OK" : "ERROR_PIN";
    }
  }
  sheet.appendRow([email, "CREDENCIALES", pin, 1, 0, 0, 0, "{}", new Date().toLocaleString("es-ES")]);
  return "OK_NUEVO";
}