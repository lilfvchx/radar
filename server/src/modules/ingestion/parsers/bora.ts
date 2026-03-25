export interface BoraNoticeEntity {
  razonSocial: string | null;
  tipoSociedad: string | null;
  socios: string[];
  metrics: {
    matchedRazonSocial: boolean;
    matchedTipoSociedad: boolean;
    sociosCount: number;
  };
}

/**
 * Parses the raw text of a BORA (Boletín Oficial de la República Argentina) notice
 * and extracts relevant information such as Razón Social, Tipo de Sociedad, and Socios.
 */
export function parseBoraNotice(text: string): BoraNoticeEntity {
  const result: BoraNoticeEntity = {
    razonSocial: null,
    tipoSociedad: null,
    socios: [],
    metrics: {
      matchedRazonSocial: false,
      matchedTipoSociedad: false,
      sociosCount: 0,
    },
  };

  if (!text || typeof text !== "string") {
    return result;
  }

  // Regex for Tipo de Sociedad (looking globally to find the first valid match)
  const regexGlobal =
    /(?:^|\s)(S\.A\.|S\.R\.L\.|S\.A\.S\.|SA|SRL|SAS|SOCIEDAD AN[OÓ]NIMA(?:\s+SIMPLIFICADA)?|SOCIEDAD DE RESPONSABILIDAD LIMITADA|SOCIEDAD POR ACCIONES SIMPLIFICADA)(?:[\s.,;]|$)/gi;

  let match;
  let matches = [];
  while ((match = regexGlobal.exec(text)) !== null) {
    matches.push(match);
  }

  if (matches.length > 0) {
    let razon = "";
    let type = "";

    // Iterate matches and find the first one that has a valid preceding Razón Social
    for (let m of matches) {
      type = m[1].trim();
      let index = m.index;
      let preceding = text.substring(0, index).trim();

      // Cut off at previous punctuation
      let lastPunct = Math.max(
        preceding.lastIndexOf("."),
        preceding.lastIndexOf(":"),
        preceding.lastIndexOf(";"),
        preceding.lastIndexOf('"'),
        preceding.lastIndexOf("'")
      );
      if (lastPunct !== -1) {
        preceding = preceding.substring(lastPunct + 1).trim();
      }

      // Cut off at common prefixes
      const prefixes = [
        "por la presente se crea",
        "se constituye",
        "constitución de sociedad",
        "denominación",
        "denominada",
        "el nombre de",
      ];
      for (let p of prefixes) {
        let idx = preceding.toLowerCase().lastIndexOf(p);
        if (idx !== -1) {
          preceding = preceding.substring(idx + p.length).trim();
        }
      }

      // Extract consecutive capitalized words right before the type
      let words = preceding.split(/\s+/);
      let capitalWords = [];
      for (let i = words.length - 1; i >= 0; i--) {
        if (!words[i]) continue;
        if (
          /^[A-ZÁÉÍÓÚÑ0-9]/.test(words[i]) ||
          words[i].toUpperCase() === words[i]
        ) {
          capitalWords.unshift(words[i]);
        } else {
          // Allow small connector words
          if (/^(de|y|la|el|los|las|en|del|con)$/i.test(words[i])) {
            capitalWords.unshift(words[i]);
          } else {
            break;
          }
        }
      }
      razon = capitalWords.join(" ").trim();
      razon = razon.replace(/^[-,.\s]+|[-,.\s]+$/g, "");
      if (razon.length > 0) {
        break; // found our Razón Social
      }
    }

    if (razon.length > 0) {
      result.razonSocial = razon;
      result.tipoSociedad = type;
      result.metrics.matchedRazonSocial = true;
      result.metrics.matchedTipoSociedad = true;
    } else if (type.length > 0) {
      result.tipoSociedad = type;
      result.metrics.matchedTipoSociedad = true;
    }
  }

  // Socios extraction
  const sociosSet = new Set<string>();

  // 1. Look for names before DNI, CUIT, CUIL, argentino, etc.
  const regexPersonasDni =
    /([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ]+\s+(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ]+\s*){1,4})(?:,|\s+)\s*(?:argentin[oa]|D\.?N\.?I\.?|DNI|CUIT|CUIL)/g;
  while ((match = regexPersonasDni.exec(text)) !== null) {
    let s = match[1].trim();
    s = s.replace(/^(?:y|a|el|la)\s+/i, "");
    sociosSet.add(s);
  }

  // 2. Look for names after designations
  const regexDesig =
    /(?:designa|nombra|design[oó]|nombr[oó]|designar|nombrar|designóse).*?(?:gerente|presidente|director|vicepresidente|socio|suplente|titular|accionista).*?(?:a\s+|al\s+|a\s+la\s+)(?:se[ñn]or\s+|se[ñn]ora\s+|Sr\.\s+|Sra\.\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ]+\s+(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ]+\s*){1,4})/gi;
  while ((match = regexDesig.exec(text)) !== null) {
    let name = match[1].trim();
    name = name.replace(/\s+(?:y|D|DNI|CUIT|CUIL|con)$/i, "").trim();
    name = name.replace(/^(?:y|a|el|la)\s+/i, "");
    sociosSet.add(name);
  }

  // Clean up set and filter out invalid names
  for (let s of Array.from(sociosSet)) {
    s = s.replace(/[,.]$/, "").trim();
    if (s.split(" ").length > 1) {
      result.socios.push(s);
    }
  }

  result.metrics.sociosCount = result.socios.length;

  return result;
}
