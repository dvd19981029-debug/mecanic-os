/**
 * Mecanic OS - Gmail DTE Webhook Ingest Script (Versión con Filtro de Fecha: 19 de Agosto en Adelante)
 * 
 * Este script busca automáticamente correos con adjuntos JSON de DTEs (Facturas Electrónicas)
 * en tu cuenta de Gmail, valida que pertenezcan a MISTER CARS, que tengan fecha del 19 de agosto de 2026
 * en adelante, los envía a Mecanic OS en Render, los marca como leídos y les aplica la etiqueta "Subido a Mecanic OS".
 */

// ==========================================
// 1. CONFIGURACIÓN DE CONEXIÓN Y DESTINO
// ==========================================
// URL oficial de la API backend de Mecanic OS en Render
const WEBHOOK_URL = "https://mecanic-os.onrender.com/api/dte/incoming-webhook";

// Token de seguridad (debe coincidir con WEBHOOK_TOKEN en tu servidor)
const WEBHOOK_TOKEN = "test_webhook_secret_key_mecanicos";

// ID de Mister Cars en tu base de datos de Mecanic OS
const WORKSHOP_ID = "Y6OONbVtuJgnctauRZhXwTpBXsh1";

// Nombre de la etiqueta que se creará y asignará automáticamente en Gmail
const LABEL_NAME = "Subido a Mecanic OS";

// ==========================================
// 2. DATOS OFICIALES Y FILTRO DE FECHA
// ==========================================
const TARGET_NIT = "05282904261010"; // NIT de MISTER CARS (sin guiones)
const TARGET_NRC = "3850993";        // NRC de MISTER CARS (sin guiones)

// Fecha de inicio (YYYY-MM-DD): Procesar solo correos y DTEs del 19 de agosto de 2026 en adelante
const START_DATE = "2026-08-19";

/**
 * Obtiene o crea la etiqueta en Gmail si aún no existe.
 */
function getOrCreateLabel() {
  let label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) {
    label = GmailApp.createLabel(LABEL_NAME);
    Logger.log("🏷️ Se creó la etiqueta en Gmail: '" + LABEL_NAME + "'");
  }
  return label;
}

/**
 * Función principal a ejecutar con activador (Trigger) cada 5 o 10 minutos.
 */
function checkGmailDte() {
  Logger.log("=== INICIANDO BÚSQUEDA DE DTEs EN GMAIL (Desde 19/Ago/2026) ===");
  
  // Buscar correos no leídos con adjuntos .json recibidos del 19 de agosto en adelante (after:2026/08/18 en Gmail)
  const query = "is:unread has:attachment filename:json after:2026/08/18";
  const threads = GmailApp.search(query, 0, 15);
  
  Logger.log("Hilos de correo no leídos encontrados: " + threads.length);
  
  if (threads.length === 0) {
    Logger.log("No hay correos nuevos con adjuntos JSON del 19 de agosto en adelante.");
    return;
  }
  
  const mcnLabel = getOrCreateLabel();
  let totalDtesEnviados = 0;
  const minDateObj = new Date(START_DATE + "T00:00:00");
  
  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    let threadContainsDteProcessed = false;
    let allDtesProcessedSuccessfully = true;
    
    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      if (!message.isUnread()) continue;
      
      // Filtro de fecha en el mensaje de correo
      const msgDate = message.getDate();
      if (msgDate < minDateObj) {
        Logger.log("ℹ️ Correo ignorado por ser anterior al " + START_DATE + ". Fecha Correo: " + msgDate);
        continue;
      }
      
      const attachments = message.getAttachments();
      let messageHasDteForUs = false;
      
      for (let k = 0; k < attachments.length; k++) {
        const attachment = attachments[k];
        const fileName = attachment.getName().toLowerCase();
        
        if (fileName.endsWith(".json")) {
          try {
            // Leer contenido y limpiar BOM UTF-8
            const contentBlob = attachment.copyBlob();
            let jsonString = contentBlob.getDataAsString();
            jsonString = jsonString.replace(/^\uFEFF/, '').trim();
            
            const dteJson = JSON.parse(jsonString);
            
            // Validar que sea un DTE de El Salvador
            if (dteJson && (dteJson.identificacion || dteJson.responseMH || dteJson.codigoGeneracion)) {
              const ident = dteJson.identificacion || {};
              const receptor = dteJson.receptor || {};
              
              const codigoGen = ident.codigoGeneracion || dteJson.codigoGeneracion || "SIN_CODIGO";
              const fecEmi = ident.fecEmi || "";
              
              // Filtro adicional por fecha de emisión del DTE (fecEmi >= 2026-08-19)
              if (fecEmi && fecEmi < START_DATE) {
                Logger.log("ℹ️ DTE ignorado (fecha de emisión del DTE '" + fecEmi + "' es anterior al " + START_DATE + ").");
                continue;
              }
              
              const receptorNit = (receptor.nit || receptor.numDocumento || "").toString().trim().replace(/[^0-9A-Za-z]/g, "");
              const receptorNrc = (receptor.nrc || "").toString().trim().replace(/[^0-9A-Za-z]/g, "");
              
              const expectedNit = TARGET_NIT.replace(/[^0-9A-Za-z]/g, "");
              const expectedNrc = TARGET_NRC.replace(/[^0-9A-Za-z]/g, "");
              
              const esParaNosotros = (receptorNit.length > 0 && receptorNit === expectedNit) || 
                                     (receptorNrc.length > 0 && receptorNrc === expectedNrc);
              
              if (esParaNosotros) {
                messageHasDteForUs = true;
                Logger.log("✅ DTE válido detectado para MISTER CARS. Fecha: " + fecEmi + " | Código Generación: " + codigoGen);
                
                // Enviar al webhook de Mecanic OS
                const success = sendToMecanicOs(dteJson);
                if (success) {
                  totalDtesEnviados++;
                  threadContainsDteProcessed = true;
                } else {
                  allDtesProcessedSuccessfully = false;
                }
              } else {
                Logger.log("ℹ️ DTE ignorado (receptor no es Mister Cars). NIT: '" + receptorNit + "' | NRC: '" + receptorNrc + "'");
              }
            }
          } catch (e) {
            Logger.log("⚠️ Error al parsear JSON adjunto '" + attachment.getName() + "': " + e.message);
          }
        }
      }
      
      // Marcar correo individual como leído si no era para nosotros o si se subió con éxito
      if (!messageHasDteForUs || allDtesProcessedSuccessfully) {
        message.markRead();
      }
    }
    
    // Si el hilo de correo contenía al menos 1 DTE enviado exitosamente a Mecanic OS, colocarle la etiqueta
    if (threadContainsDteProcessed && allDtesProcessedSuccessfully) {
      mcnLabel.addToThread(thread);
      Logger.log("🏷️ Etiqueta '" + LABEL_NAME + "' aplicada al correo.");
    }
  }
  
  Logger.log("=== FIN DEL PROCESO: " + totalDtesEnviados + " DTE(s) PROCESADOS Y ETIQUETADOS ===");
}

/**
 * Envia el payload del DTE al endpoint webhook de Mecanic OS
 */
function sendToMecanicOs(dteJson) {
  const payload = {
    dteJson: dteJson,
    workshopId: WORKSHOP_ID
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Webhook-Token": WEBHOOK_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    Logger.log("Respuesta Servidor Mecanic OS (" + responseCode + "): " + responseBody);
    
    if (responseCode === 200) {
      const resData = JSON.parse(responseBody);
      return resData.success === true;
    }
    return false;
  } catch (e) {
    Logger.log("❌ Error en UrlFetchApp.fetch: " + e.message);
    return false;
  }
}
