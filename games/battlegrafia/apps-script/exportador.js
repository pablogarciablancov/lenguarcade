/**
 * Genera una copia de todos los archivos del proyecto actual 
 * y los guarda en una carpeta específica de Google Drive.
 */
function descargarProyectoADrive() {
  // 1. CONFIGURACIÓN: Reemplaza con el ID de una carpeta de Drive donde quieras los archivos
  // Puedes encontrar el ID en la URL de la carpeta: drive.google.com/drive/folders/TU_ID_AQUÍ
  const FOLDER_ID = '1NxsIpA-amLu2Opq7cQCMGP8r1ucwdjfx'; 
  
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const scriptId = ScriptApp.getScriptId();
    
    // Obtenemos el contenido del proyecto a través de la API de Google (requiere servicio avanzado)
    // Pero para simplificar al profesor, usaremos un enfoque de exportación de Drive
    const url = "https://script.google.com/feeds/download/export?id=" + scriptId + "&format=json";
    const token = ScriptApp.getOAuthToken();
    
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    const contenido = JSON.parse(response.getContentText());
    const files = contenido.files;
    
    files.forEach(file => {
      let nombreArchivo = file.name + (file.type === 'html' ? '.html' : '.gs');
      folder.createFile(nombreArchivo, file.source);
    });
    
    Logger.log("✅ ¡Éxito! Se han creado " + files.length + " archivos en tu carpeta de Drive.");
    
  } catch (e) {
    Logger.log("❌ Error: " + e.toString());
  }
}