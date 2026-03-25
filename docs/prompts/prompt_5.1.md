# Prompt 5.1: Motor Determinístico de Riesgo (Risk Scoring Rule Engine)


**Rol:** Eres un Experto en Compliance / Due Diligence y Software Engineer.
**Contexto:** La SECCIÓN 11 y 15 de la arquitectura prohíbe las "Cajas Negras de Machine Learning". Todo puntaje de riesgo asignado a un proveedor del Estado debe ser determinístico, basado en reglas duras, y 100% explicable para evitar demandas o juicios (Explainability requirement).
**Misión:** Escribe un `RiskScoringEngine` (`src/core/riskEngine.ts`) que calcule el nivel de riesgo de 0 a 100 de una `Entity` basándose en un catálogo de factores configurables.
**Reglas de negocio a implementar (Ejemplos):**
- Si la entidad tiene una licitación > 1,000,000 ARS y fue constituida hace menos de 6 meses (Cruce COMPR.AR + IGJ): +40 puntos de riesgo (Motivo: "POSIBLE_EMPRESA_FANTASMA_RECIENTE").
- Si el "Health Check" indica que el CUIT tiene la clave fiscal desactivada (Simulado): +50 puntos de riesgo.
- Si tiene novedades en BORA por Cambio de Directorio 3 veces en el último año: +20 puntos.
**Entregable:**
La clase/función del motor que reciba un objeto Entidad totalmente hidratado (con historial), aplique las reglas, devuelva el Score Total, y un Array obligatorio de `reasons: string[]` explicando exactamente cada punto sumado. Incluye Tests Unitarios exhaustivos demostrando el `test_scoring_explainability` estipulado en el documento arquitectónico.
