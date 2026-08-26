/**
 * Mecanic OS - Script de Envío de Correos DTE para Google Apps Script
 * 
 * Este script se despliega como Web App en tu cuenta de Gmail (ventas@forbiddensoluciones.com)
 * y permite que Mecanic OS envíe los correos de DTE (PDF + JSON adjuntos)
 * con la máscara del taller correspondiente y el botón de responder apuntando al taller.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "No post data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var contents = JSON.parse(e.postData.contents);
    
    if (contents.action === "sendDteEmail" || contents.action === "sendBudgetEmail") {
      var recipient = contents.recipientEmail;
      var subject = contents.subject || (contents.action === "sendBudgetEmail" ? "Presupuesto de Reparación" : "Documento Tributario Electrónico");
      var htmlBody = contents.htmlBody;
      var senderName = contents.senderName || (contents.action === "sendBudgetEmail" ? "Mister Cars - Presupuestos" : "Mister Cars - DTE");
      var replyTo = contents.replyTo || "ventas@forbiddensoluciones.com";
      
      var attachments = [];
      
      if (contents.pdfBase64) {
        attachments.push(Utilities.newBlob(
          Utilities.base64Decode(contents.pdfBase64), 
          'application/pdf', 
          contents.pdfName || (contents.action === "sendBudgetEmail" ? 'Presupuesto.pdf' : 'DTE.pdf')
        ));
      } else if (contents.pdfHtml) {
        var pdfBlob = Utilities.newBlob(contents.pdfHtml, 'text/html', 'presupuesto.html')
                               .getAs('application/pdf')
                               .setName(contents.pdfName || 'Presupuesto.pdf');
        attachments.push(pdfBlob);
      }
      
      if (contents.jsonBase64) {
        attachments.push(Utilities.newBlob(
          Utilities.base64Decode(contents.jsonBase64), 
          'application/json', 
          contents.jsonName || 'DTE.json'
        ));
      }
      
      GmailApp.sendEmail(recipient, subject, "", {
        htmlBody: htmlBody,
        name: senderName,
        replyTo: replyTo,
        attachments: attachments
      });
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        message: "Correo enviado exitosamente vía Apps Script desde " + senderName 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Acción no válida" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    status: "online",
    service: "Mecanic OS Mail Gateway",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
