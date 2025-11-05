# ⚙️ Guía de Configuración

## Estructura de Datos

### Pestaña TAREAS
| Columna | Descripción | Obligatorio |
|---------|-------------|-------------|
| A - ID_Tarea | Automático | ✅ |
| B - Fecha_Creacion | Automático | ✅ |
| C - Tarea | Descripción | ✅ |
| D - Asignado_A | Email | ✅ |
| E - Fecha_Limite | Fecha | ❌ |
| F - Estado | Texto | ❌ |
| G - Prioridad | Alta/Media/Baja | ✅ |
| H - Ultima_Modificacion | Automático | ✅ |
| I - Notificado | Automático | ✅ |

### Pestaña CONFIG
Configuración del sistema (se crea automáticamente):

## Opciones de Configuración

### 🔔 Notificaciones
- `NOTIFICAR_NUEVAS_TAREAS`: Notificar nuevas tareas (TRUE/FALSE)
- `NOTIFICAR_REASIGNACION`: Notificar reasignaciones (TRUE/FALSE)  
- `NOTIFICAR_PRIORIDAD`: Notificar cambios de prioridad (TRUE/FALSE)

### 🎯 Prioridades
Qué cambios de prioridad notificar:
- `PRIORIDAD_BAJA_ALTA`: Baja → Alta
- `PRIORIDAD_MEDIA_ALTA`: Media → Alta
- `PRIORIDAD_ALTA_MEDIA`: Alta → Media
- `PRIORIDAD_ALTA_BAJA`: Alta → Baja
- `PRIORIDAD_MEDIA_BAJA`: Media → Baja
- `PRIORIDAD_BAJA_MEDIA`: Baja → Media

### 📧 Email
- `EMAIL_REMITENTE`: Nombre del remitente (opcional)
- `EMAIL_ASUNTO_PREFIX`: Prefijo para asuntos

## Comportamiento del Sistema

### Nuevas Tareas
Se notifican cuando están completos:
- ✅ Tarea (columna C)
- ✅ Asignado A (columna D) 
- ✅ Prioridad (columna G)

### Tareas Existentes
- **Reasignaciones**: Se notifican al cambiar "Asignado A"
- **Cambios de prioridad**: Según configuración en CONFIG

## Comandos Útiles

### Apps Script
```javascript
installSystem()     // Instalar todo el sistema
setupTriggers()     // Configurar triggers solamente
testSystem()        // Probar envío de emails
showConfig()        // Ver configuración actual
resetConfig()       // Reiniciar configuración
