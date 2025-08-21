# 📅 Flujo de Confirmación de Citas

## 🔄 Cómo Funciona el Sistema de Estados

### Estados de las Citas:
1. **Pendiente (Pending)** - Estado inicial cuando se crea una cita
2. **Confirmada (Confirmed)** - El dueño del negocio aprobó la cita
3. **Cancelada (Cancelled)** - La cita fue cancelada

## 📧 Proceso Completo de una Cita

### 1️⃣ Cliente Reserva una Cita
- El cliente selecciona servicio, fecha y hora
- La cita se crea con estado **"Pendiente"**
- Se envía email de confirmación con archivo .ics

### 2️⃣ Cliente Acepta el Calendario (.ics)
- El cliente puede agregar la cita a su calendario personal
- **IMPORTANTE:** Esto NO cambia el estado de la cita
- El archivo .ics es solo para conveniencia del cliente
- La cita sigue en estado **"Pendiente"**

### 3️⃣ Dueño del Negocio Confirma la Cita
- Ve a **Dashboard → Appointments**
- Encuentra la cita pendiente
- Click en **"Confirm"** (Confirmar)
- El estado cambia a **"Confirmada"**
- La cita está oficialmente aprobada

## ❓ Preguntas Frecuentes

### ¿Por qué aceptar el calendario no confirma la cita?
**Respuesta:** Aceptar el archivo .ics solo agrega la cita al calendario personal del cliente. La confirmación real debe venir del negocio para:
- Verificar disponibilidad del personal
- Confirmar que el horario está disponible
- Aprobar la reserva manualmente
- Mantener control sobre las citas

### ¿Cómo sé si mi cita fue confirmada?
**Como Cliente:**
- Recibirás un email inicial con los detalles
- El negocio debe contactarte para confirmar

**Como Dueño:**
- Ve a Dashboard → Appointments
- Las citas pendientes tienen etiqueta amarilla
- Las confirmadas tienen etiqueta verde

### ¿Puedo automatizar la confirmación?
**Actualmente:** No, todas las citas requieren confirmación manual
**Razón:** Esto te da control total sobre tu agenda y evita overbooking

## 🎯 Flujo Recomendado para el Dueño

### Diariamente:
1. Revisa **Dashboard → Appointments**
2. Filtra por estado **"Pending"**
3. Revisa cada cita nueva
4. **Confirma** las que puedes atender
5. **Cancela** las que no puedes atender
6. Contacta a los clientes si es necesario

### Tips:
- Confirma las citas lo antes posible
- Los clientes esperan confirmación rápida
- Considera confirmar inmediatamente si tienes disponibilidad clara
- Usa los filtros por fecha para revisar citas futuras

## 📊 Estados en el Dashboard

### Vista de Citas:
```
Pendiente (amarillo) → Necesita tu acción
Confirmada (verde) → Lista para atender
Cancelada (rojo) → No se realizará
```

### Acciones Disponibles:
- **Pendiente** → Puedes Confirmar o Cancelar
- **Confirmada** → Puedes Cancelar si es necesario
- **Cancelada** → Solo puedes Eliminar

## 💡 Mejores Prácticas

1. **Revisa citas pendientes** al menos 2 veces al día
2. **Confirma rápidamente** para dar certeza al cliente
3. **Cancela con tiempo** si no puedes atender
4. **Mantén actualizado** el estado de las citas
5. **Elimina citas viejas** para mantener limpio el dashboard

## 🔔 Recordatorio Importante

El archivo .ics que recibe el cliente es para su conveniencia personal. **NO es una confirmación del negocio**. La confirmación real ocurre cuando cambias el estado en el Dashboard.

---

## Resumen Rápido

✅ **Cliente reserva** → Estado: Pendiente
📧 **Email enviado** → Cliente recibe detalles + .ics
📅 **Cliente acepta .ics** → Solo agrega a su calendario
⏳ **Cita sigue pendiente** → Necesita tu confirmación
👍 **Tú confirmas** → Estado: Confirmada
✨ **Cita aprobada** → Lista para realizarse