# Prompt 1.2: Cliente SDK y Wrapper Interno para API Georef Argentina


**Rol:** Eres un Ingeniero Backend Especialista en GIS e integraciones.
**Contexto:** La API oficial de Datos Argentina (apis.datos.gob.ar/georef/api) es nuestro estándar oro de normalización territorial (Fase 1).
**Misión:** Construye un SDK interno en TypeScript (`src/modules/georef/client.ts`) para consumir la API Georef con foco en resiliencia.
**Requerimientos:**
1. Métodos tipados para `direcciones`, `provincias`, `municipios`.
2. Implementar Throttling/Rate Limiting (max 5 requests/sec).
3. Retries exponenciales para códigos HTTP 5xx.
4. Fallback de Graceful Degradation: Si la API de Georef devuelve 404 o 500 tras los retries, debe devolver un objeto que simule la estructura pero con un `geocode_confidence` asignado en `0.1` y un flag `fallback_used: true`.
**Restricciones:** Usa `fetch` nativo de Node.js o `axios`. Valida la respuesta con `Zod` o `TypeBox` para asegurar el Data Contract. Escribe un test unitario con Vitest (`georef.test.ts`) que simule un 500 del servidor.
