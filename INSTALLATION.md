# 🛠️ Guía de Instalación

## Prerrequisitos
- Cuenta de Google
- Google Sheets
- Acceso a Google Apps Script

## Pasos de Instalación

### 1. Preparar Google Sheets
Crea una nueva hoja de cálculo o usa una existente.

### 2. Estructurar las pestañas
- **TAREAS**: Para gestionar las tareas
- **CONFIG**: Para configuración (se crea automáticamente)

### 3. Configurar Apps Script
1. Ve a `Extensiones > Apps Script`
2. Elimina cualquier código existente
3. Pega el código completo del sistema
4. Guarda el proyecto

### 4. Instalar el sistema
1. Ejecuta la función `installSystem()`
2. Autoriza los permisos requeridos
3. Confirma la instalación

### 5. Probar
1. Ve a la pestaña "TAREAS"
2. Agrega una nueva fila
3. Completa: Tarea, Asignado A, Prioridad
4. Verifica que llegue el email

## 🔧 Permisos Requeridos
- Acceso a Google Sheets (leer/escribir)
- Envío de emails por Gmail
- Ejecución de triggers

## ❌ Solución de Problemas

### No llegan los emails
- Revisa la carpeta de spam
- Verifica que el email en "Asignado A" sea válido
- Confirma que los triggers estén activos

### Error en la instalación
- Ejecuta `installSystem()` nuevamente
- Verifica que la pestaña se llame exactamente "TAREAS"
- Revisa la consola de Apps Script para logs

### Los triggers no funcionan
- Ejecuta `setupTriggers()` manualmente
- Verifica en `Editar > Triggers del proyecto`
