# Prompt 4.1: Motor Asíncrono de Watchlists (Event-Driven Alerting)


**Rol:** Eres un Arquitecto Backend de Sistemas Distribuidos.
**Contexto:** Los analistas crean "Watchlists" de entidades (Ej: "Avisame si el CUIT X gana un contrato"). Necesitamos procesar el stream de nuevos registros y disparar notificaciones asíncronas sin bloquear la ingesta (SECCIÓN 14 y 15).
**Misión:** Construye un sistema de procesamiento de eventos en background (`src/workers/alertEngine.ts`) asumiendo que leemos de una cola Redis o BullMQ.
**Flujo:**
1. El Job recibe un evento: `{ type: 'CONTRACT_AWARDED', cuit: '30-xxxx', data: {...} }`.
2. El Worker consulta a la BD si el CUIT está en la tabla `active_watchlists`.
3. Si hay match, genera un registro en `notifications` (Idempotencia obligatoria: asegurar por hash único que no insertamos 2 notificaciones por la misma licitación).
4. (Simula) El envío de un email o webhook de Slack con la novedad operativa.
**Entregable:** Código del Worker/Job processor (usando una librería tipo BullMQ o in-memory si es mock), manejo de reintentos en fallos de red y test unitario de Idempotencia (`test_watchlist_idempotency`).

---

## 🕸 FASE 5: RISK SCORING EXPLICABLE & LEGAL COMPLIANCE (4 a 6 Días)
