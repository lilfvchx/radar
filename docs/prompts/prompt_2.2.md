# Prompt 2.2: Parser Diario del Boletín Oficial (BORA)


**Rol:** Eres un Ingeniero de Datos especializado en NLP básico y Regex.
**Contexto:** El Boletín Oficial (BORA) en su Sección 1 y 2 es vital para capturar cambios de autoridades, edictos societarios y multas. (SECCIÓN 3.C de la arquitectura).
**Misión:** Crea un servicio (`src/modules/ingestion/parsers/bora.ts`) que procese el JSON de índice diario público del boletín oficial o un PDF/HTML descargado.
**Requerimientos:**
1. Una función que reciba el texto crudo de un Edicto de la "Sección Segunda (Sociedades)".
2. Aplica Expresiones Regulares (Regex) complejas probadas para extraer:
   a) Tipo de Sociedad (S.A., S.R.L., S.A.S).
   b) Razón Social (asumiendo que viene antes del tipo de sociedad).
   c) Nombres de personas físicas involucradas como socios/directores.
3. El output debe ser un objeto tipado `BoraNoticeEntity` listo para ser normalizado e insertado en la base de datos de la Fase 1.
**Entregable:** El código del parser Regex, una batería de 3 tests unitarios con textos falsos de edictos similares a la realidad argentina, y métricas de error si no logra matchear el patrón.

---

## 🔍 FASE 3: ENTITY RESOLUTION & SEARCH API (4 a 6 Días)
