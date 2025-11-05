/**
 * SISTEMA DE NOTIFICACIONES AUTOMATIZADAS
 * Google Sheets + Google Apps Script
 * Versión Final - Lista para Usar
 */

// =============================================
// CONFIGURACIÓN GLOBAL
// =============================================
const CONFIG = {
  sheetName: "TAREAS",
  configSheetName: "CONFIG",
  startRow: 2,
  columns: {
    id: 1,                    // A - ID_Tarea
    fechaCreacion: 2,         // B - Fecha_Creacion  
    tarea: 3,                 // C - Tarea
    asignadoA: 4,             // D - Asignado_A
    fechaLimite: 5,           // E - Fecha_Limite
    estado: 6,                // F - Estado
    prioridad: 7,             // G - Prioridad
    ultimaModificacion: 8,    // H - Ultima_Modificacion
    notificado: 9             // I - Notificado
  }
};

// =============================================
// FUNCIÓN PRINCIPAL - ONEDIT
// =============================================
function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    
    // Verificar si es la hoja correcta y fila válida
    if (sheet.getName() !== CONFIG.sheetName || range.getRow() < CONFIG.startRow) return;
    
    const rowData = getRowData(sheet, range.getRow());
    
    // Inicializar nueva fila si es necesario
    if (!rowData.id) {
      initializeNewRow(sheet, range.getRow());
      Object.assign(rowData, getRowData(sheet, range.getRow()));
    }
    
    // Verificar si debe enviar notificación
    const notification = checkNotification(rowData, range.getColumn(), e.oldValue);
    
    if (notification.shouldNotify) {
      const config = getConfig();
      
      switch (notification.type) {
        case "cambio_prioridad":
          sendPriorityChangeNotification(rowData, notification.oldPriority, config);
          break;
        case "reasignacion":
          sendReassignmentNotification(rowData, e.oldValue, config);
          break;
        default:
          sendNewTaskNotification(rowData, config);
          break;
      }
      
      markAsNotified(sheet, range.getRow(), notification.type);
    }
    
  } catch (error) {
    console.error("Error en onEdit:", error);
  }
}

// =============================================
// FUNCIONES DE LÓGICA PRINCIPAL
// =============================================
function checkNotification(rowData, editedColumn, oldValue) {
  const config = getConfig();
  
  // 1. Si ya fue notificado, verificar reasignaciones o cambios de prioridad
  if (rowData.notificado) {
    if (editedColumn === CONFIG.columns.asignadoA && config.NOTIFICAR_REASIGNACION) {
      return { shouldNotify: true, type: "reasignacion" };
    }
    if (editedColumn === CONFIG.columns.prioridad && config.NOTIFICAR_PRIORIDAD) {
      const priorityChange = checkPriorityChange(oldValue, rowData.prioridad, config);
      if (priorityChange.shouldNotify) {
        return { shouldNotify: true, type: "cambio_prioridad", oldPriority: oldValue };
      }
    }
    return { shouldNotify: false };
  }
  
  // 2. Nueva tarea - solo requiere tarea y asignado
  if (rowData.tarea && rowData.asignadoA && rowData.prioridad && config.NOTIFICAR_NUEVAS_TAREAS) {
    return { shouldNotify: true, type: "nueva_tarea" };
  }
  
  return { shouldNotify: false };
}

function checkPriorityChange(oldPriority, newPriority, config) {
  if (!oldPriority || !newPriority) return { shouldNotify: false };
  
  const changeKey = `PRIORIDAD_${oldPriority.toUpperCase()}_${newPriority.toUpperCase()}`;
  
  if (config.hasOwnProperty(changeKey)) {
    return { shouldNotify: config[changeKey] };
  }
  
  return { shouldNotify: false };
}

// =============================================
// FUNCIONES DE GESTIÓN DE DATOS
// =============================================
function getRowData(sheet, row) {
  const dataRange = sheet.getRange(row, 1, 1, sheet.getLastColumn());
  const values = dataRange.getValues()[0];
  
  return {
    id: values[CONFIG.columns.id - 1],
    fechaCreacion: values[CONFIG.columns.fechaCreacion - 1],
    tarea: values[CONFIG.columns.tarea - 1],
    asignadoA: values[CONFIG.columns.asignadoA - 1],
    fechaLimite: values[CONFIG.columns.fechaLimite - 1],
    estado: values[CONFIG.columns.estado - 1],
    prioridad: values[CONFIG.columns.prioridad - 1],
    ultimaModificacion: values[CONFIG.columns.ultimaModificacion - 1],
    notificado: values[CONFIG.columns.notificado - 1],
    rowNumber: row
  };
}

function initializeNewRow(sheet, row) {
  const idRange = sheet.getRange(row, CONFIG.columns.id);
  const fechaRange = sheet.getRange(row, CONFIG.columns.fechaCreacion);
  
  if (!idRange.getValue()) {
    idRange.setValue(`TASK-${Utilities.getUuid().slice(0, 8).toUpperCase()}`);
  }
  
  if (!fechaRange.getValue()) {
    fechaRange.setValue(new Date());
  }
  
  sheet.getRange(row, CONFIG.columns.ultimaModificacion).setValue(new Date());
}

function markAsNotified(sheet, row, notificationType) {
  sheet.getRange(row, CONFIG.columns.notificado).setValue(`SÍ - ${notificationType}`);
  sheet.getRange(row, CONFIG.columns.ultimaModificacion).setValue(new Date());
}

// =============================================
// FUNCIONES DE NOTIFICACIÓN POR EMAIL
// =============================================
function sendNewTaskNotification(rowData, config) {
  const emailAddress = rowData.asignadoA;
  if (!isValidEmail(emailAddress)) return;
  
  const subject = `${config.EMAIL_ASUNTO_PREFIX || ''} 📋 Nueva Tarea: ${rowData.tarea}`;
  const htmlBody = createEmailBody(rowData, "nueva_tarea");
  
  const emailOptions = {
    to: emailAddress,
    subject: subject,
    htmlBody: htmlBody
  };
  
  if (config.EMAIL_REMITENTE) emailOptions.name = config.EMAIL_REMITENTE;
  
  MailApp.sendEmail(emailOptions);
  console.log(`Notificación enviada a: ${emailAddress}`);
}

function sendReassignmentNotification(rowData, oldAssignee, config) {
  const emailAddress = rowData.asignadoA;
  if (!isValidEmail(emailAddress)) return;
  
  const subject = `${config.EMAIL_ASUNTO_PREFIX || ''} 🔄 Tarea Reasignada: ${rowData.tarea}`;
  const htmlBody = createEmailBody(rowData, "reasignacion", oldAssignee);
  
  const emailOptions = {
    to: emailAddress,
    subject: subject,
    htmlBody: htmlBody
  };
  
  if (config.EMAIL_REMITENTE) emailOptions.name = config.EMAIL_REMITENTE;
  
  MailApp.sendEmail(emailOptions);
  console.log(`Reasignación enviada a: ${emailAddress}`);
}

function sendPriorityChangeNotification(rowData, oldPriority, config) {
  const emailAddress = rowData.asignadoA;
  if (!isValidEmail(emailAddress)) return;
  
  const urgencyWord = getUrgencyWord(oldPriority, rowData.prioridad);
  const subject = `${config.EMAIL_ASUNTO_PREFIX || ''} ${urgencyWord} Prioridad Cambiada: ${rowData.tarea}`;
  const htmlBody = createEmailBody(rowData, "cambio_prioridad", oldPriority);
  
  const emailOptions = {
    to: emailAddress,
    subject: subject,
    htmlBody: htmlBody
  };
  
  if (config.EMAIL_REMITENTE) emailOptions.name = config.EMAIL_REMITENTE;
  
  MailApp.sendEmail(emailOptions);
  console.log(`Cambio de prioridad enviado a: ${emailAddress}`);
}

// =============================================
// TEMPLATES DE EMAIL
// =============================================
function createEmailBody(rowData, type, extraData = null) {
  const spreadsheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const taskUrl = `${spreadsheetUrl}#gid=${SpreadsheetApp.getActiveSheet().getSheetId()}&range=A${rowData.rowNumber}`;
  
  let title, headerColor, headerText;
  
  switch (type) {
    case "reasignacion":
      title = "🔄 Tarea Reasignada";
      headerColor = "#3498db";
      headerText = `Reasignada de ${extraData || 'No asignado'} a ${rowData.asignadoA}`;
      break;
    case "cambio_prioridad":
      title = "📊 Cambio de Prioridad";
      headerColor = getPriorityColor(rowData.prioridad);
      headerText = `Cambio de ${extraData} a ${rowData.prioridad}`;
      break;
    default:
      title = "🎯 Nueva Tarea Asignada";
      headerColor = "#667eea";
      headerText = "Has sido asignado a una nueva tarea";
  }
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, ${headerColor} 0%, #2c3e50 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">${headerText}</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <div style="background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">${rowData.tarea}</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Prioridad:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background-color: ${getPriorityColor(rowData.prioridad)}; color: white;">
                  ${rowData.prioridad || 'No especificada'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha Límite:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(rowData.fechaLimite) || 'No especificada'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Estado:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${rowData.estado || 'Pendiente'}</td>
            </tr>
          </table>
          
          <div style="margin: 25px 0; text-align: center;">
            <a href="${taskUrl}" style="background: ${headerColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              📊 Ver Tarea en el Sistema
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666;">
            <p>Email enviado automáticamente desde el Sistema de Gestión de Tareas.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================
function getUrgencyWord(oldPriority, newPriority) {
  if ((oldPriority === "Baja" || oldPriority === "Media") && newPriority === "Alta") return "🚨";
  if (oldPriority === "Alta" && (newPriority === "Media" || newPriority === "Baja")) return "✅";
  return "📊";
}

function getPriorityColor(prioridad) {
  const colors = {
    'Alta': '#e74c3c',
    'Media': '#f39c12', 
    'Baja': '#27ae60'
  };
  return colors[prioridad] || '#95a5a6';
}

function formatDate(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// =============================================
// SISTEMA DE CONFIGURACIÓN
// =============================================
function getConfig() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.getSheetByName(CONFIG.configSheetName);
  
  if (!configSheet) return createDefaultConfig();
  
  const data = configSheet.getDataRange().getValues();
  const config = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const clave = row[1];
    const valor = row[2];
    
    if (clave) {
      if (valor === "TRUE" || valor === "FALSE") {
        config[clave] = valor === "TRUE";
      } else {
        config[clave] = valor;
      }
    }
  }
  
  return config;
}

function createDefaultConfig() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.insertSheet(CONFIG.configSheetName);
  
  // Encabezados
  configSheet.getRange("A1:D1").setValues([["Sección", "Clave", "Valor", "Descripción"]]);
  
  // Datos por defecto
  const defaultConfig = [
    ["Notificaciones", "NOTIFICAR_NUEVAS_TAREAS", "TRUE", "Notificar cuando se crea nueva tarea"],
    ["Notificaciones", "NOTIFICAR_REASIGNACION", "TRUE", "Notificar cuando se reasigna tarea"],
    ["Notificaciones", "NOTIFICAR_PRIORIDAD", "TRUE", "Notificar cambios de prioridad"],
    ["Prioridades", "PRIORIDAD_BAJA_ALTA", "TRUE", "Notificar cambio de Baja a Alta"],
    ["Prioridades", "PRIORIDAD_MEDIA_ALTA", "TRUE", "Notificar cambio de Media a Alta"],
    ["Prioridades", "PRIORIDAD_ALTA_MEDIA", "TRUE", "Notificar cambio de Alta a Media"],
    ["Prioridades", "PRIORIDAD_ALTA_BAJA", "TRUE", "Notificar cambio de Alta a Baja"],
    ["Prioridades", "PRIORIDAD_MEDIA_BAJA", "FALSE", "Notificar cambio de Media a Baja"],
    ["Prioridades", "PRIORIDAD_BAJA_MEDIA", "FALSE", "Notificar cambio de Baja a Media"],
    ["Email", "EMAIL_REMITENTE", "", "Email del remitente (opcional)"],
    ["Email", "EMAIL_ASUNTO_PREFIX", "[Sistema Tareas]", "Prefijo para asunto de email"]
  ];
  
  configSheet.getRange(2, 1, defaultConfig.length, 4).setValues(defaultConfig);
  
  // Formatear
  configSheet.getRange("A:D").setWrap(true);
  configSheet.autoResizeColumns(1, 4);
  configSheet.getRange("A1:D1").setFontWeight("bold");
  configSheet.setFrozenRows(1);
  
  return getConfig();
}

// =============================================
// FUNCIONES DE INSTALACIÓN Y CONFIGURACIÓN
// =============================================
function setupTriggers() {
  // Eliminar triggers existentes
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Crear trigger para ediciones
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  
  console.log("✅ Trigger configurado: onEdit");
}

function installSystem() {
  console.log("🚀 Instalando sistema...");
  
  try {
    // Crear configuración
    createDefaultConfig();
    console.log("✅ Configuración creada");
    
    // Configurar triggers
    setupTriggers();
    console.log("✅ Triggers configurados");
    
    // Probar sistema
    testSystem();
    
    console.log("🎉 Sistema instalado correctamente");
    
    SpreadsheetApp.getUi().alert(
      'Sistema Instalado', 
      'El sistema de notificaciones ha sido instalado correctamente.\n\n' +
      'Para usar:\n' +
      '1. Ve a la hoja TAREAS\n' +
      '2. Agrega una nueva fila\n' + 
      '3. Completa al menos "Tarea" y "Asignado A"\n' +
      '4. La notificación se enviará automáticamente',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    console.error("❌ Error instalando sistema:", error);
    SpreadsheetApp.getUi().alert('Error', 'Error al instalar: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function testSystem() {
  console.log("🧪 Probando sistema...");
  
  try {
    const config = getConfig();
    const testEmail = Session.getEffectiveUser().getEmail();
    
    // Enviar email de prueba
    MailApp.sendEmail({
      to: testEmail,
      subject: "✅ Prueba - Sistema de Notificaciones",
      body: "El sistema de notificaciones funciona correctamente."
    });
    
    console.log("✅ Email de prueba enviado");
    
  } catch (error) {
    console.error("❌ Error en prueba:", error);
  }
}

// =============================================
// FUNCIONES ADICIONALES ÚTILES
// =============================================
function showConfig() {
  const config = getConfig();
  const configText = Object.keys(config)
    .map(key => `${key}: ${config[key]}`)
    .join('\n');
  
  SpreadsheetApp.getUi().alert('Configuración Actual', configText, SpreadsheetApp.getUi().ButtonSet.OK);
}

function resetConfig() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.getSheetByName(CONFIG.configSheetName);
  
  if (configSheet) {
    spreadsheet.deleteSheet(configSheet);
  }
  
  createDefaultConfig();
  console.log("✅ Configuración reiniciada");
}
