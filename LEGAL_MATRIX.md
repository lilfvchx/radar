# Matriz Legal / Robots.txt / TOS - Argentina Crime OSINT

Este documento resume la estrategia legal para la ingesta de noticias y datos en la plataforma de Fusión Operacional, cumpliendo con la premisa *RSS-first*, respeto por las condiciones de uso, y extracción mínima (metadata + extracto corto).

| Fuente / Entidad | URL de Referencia | robots.txt URL | Términos de Servicio (TOS) | Estrategia de Ingesta | Notas y Restricciones |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Datos Argentina** | datos.gob.ar | /robots.txt | Permite reutilización | API CKAN (package_search) | Datos oficiales abiertos. Uso libre. |
| **GeoRef API** | apis.datos.gob.ar/georef/ | /robots.txt | Permite reutilización | API REST | Datos oficiales abiertos. |
| **BA Data (GCBA)** | data.buenosaires.gob.ar | /robots.txt | Licencia Abierta | Descarga CSV/API | Datos oficiales. Uso libre con atribución. |
| **PBA Catálogo** | catalogo.datos.gba.gob.ar | /robots.txt | Licencia Abierta | Descarga CSV/Shapefile | Datos oficiales. |
| **Ministerio Público (Nación)** | fiscales.gob.ar | /robots.txt | Institucional | RSS / Scraping Ligero | Priorizar RSS si está disponible; fallback a HTML. |
| **PFA (Policía Federal)** | argentina.gob.ar/policia-federal-argentina | /robots.txt | Institucional | Scraping HTML | Scraping de noticias/comunicados oficiales. |
| **Página/12** | pagina12.com.ar | /robots.txt | Propiedad Intelectual estricta | **RSS-only** | Utilizar exclusivamente feeds RSS de la sección Política/Sociedad. |
| **La Voz del Interior** | lavoz.com.ar | /robots.txt | [Condiciones RSS](https://www.lavoz.com.ar/condiciones-rss/) | **RSS-only** | Condiciones explícitas de uso de titulares RSS (requiere atribución y no alterar contenido). |
| **Clarín** | clarin.com | /robots.txt | Propiedad Intelectual estricta | RSS (si accesible) | Endpoints RSS suelen retornar 403; requiere contingencia. |
| **Infobae** | infobae.com | /robots.txt | Propiedad Intelectual estricta | Requiere acuerdo / RSS | No se encontró RSS estable para sección "Crimen y Justicia". Ingesta vía scraping de la sección *sólo bajo feature flag explícito*. |

## Reglas de Implementación

1.  **Priorizar Oficiales:** Las fuentes primarias (Datos Argentina, GeoRef, BA Data) tienen prioridad máxima y se pueden consultar libremente.
2.  **Estrategia RSS-First:** Para medios periodísticos, solo se ingiere la metadata (Título, Enlace, Resumen, Fecha de Publicación) a través de canales oficiales RSS.
3.  **No Extracción Completa (No Full-Text):** El sistema **no** descarga ni almacena el cuerpo completo del artículo de medios, previniendo violaciones de Copyright.
4.  **Respeto por robots.txt y Rate Limits:** Toda recolección automatizada (scraping o API) utiliza `User-Agent` descriptivo y respeta un límite de peticiones conservador. Al utilizar herramientas externas como Apify, se activa el flag `respectRobotsTxtFile: true`.
5.  **Acuerdos para Scraping Agresivo:** Cualquier scraping directo al HTML de Infobae, Clarín o La Voz requiere aprobación explícita y se encuentra deshabilitado por defecto (`AR_CRIME_INGEST_ENABLE_MEDIA_SCRAPERS=false`).
