# Prompt 3.2: API de Búsqueda de Entidades (Dossier Unificado)


**Rol:** Eres un Backend API Developer (Node.js/Express).
**Contexto:** Necesitamos exponer la información unificada al Frontend de los analistas OSINT.
**Misión:** Escribe las rutas y controladores (`src/routes/entities.ts`) para una API RESTFUL que busque y entregue un "Dossier 360".
**Endpoints:**
1. `GET /api/v1/entities?q={cuit_o_nombre}&jurisdiction={caba}` -> Búsqueda full-text o exacta.
2. `GET /api/v1/entities/:uuid/dossier` -> Devuelve un JSON consolidado con: Datos Maestros (CUIT, Nombres), Array de Domicilios Normalizados, Array de Novedades BORA relacionadas, y Array de Licitaciones Adjudicadas (COMPR.AR).
**Restricciones:**
- La consulta SQL (o mediante ORM) para el endpoint `/dossier` debe ser eficiente (uso de LEFT JOINs correctos).
- Si el CUIT no existe, 404 limpio.
- Throttling a la API: 10 requests / seg.
**Entregable:** Archivo de rutas de Express/Fastify, esquemas de validación de Request/Response usando Zod, e inyección de dependencias para los repositorios.

---

## ⚡ FASE 4: WORKFLOWS, ALERTAS & WATCHLISTS (3 a 5 Días)
