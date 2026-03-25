import { parseBoraNotice } from "../bora";

describe("BORA Parser - Edicto de la Sección Segunda (Sociedades)", () => {
  it("should extract Razón Social, Tipo de Sociedad, and Socios (Designations)", () => {
    const text =
      "EL HORNERO S.R.L. Por acta de reunión de socios del 10/10/2023 se resolvió designar gerente a JUAN CARLOS PEREZ, D.N.I. 12.345.678, y a MARIA GOMEZ, DNI 87.654.321.";
    const result = parseBoraNotice(text);

    expect(result.metrics.matchedRazonSocial).toBe(true);
    expect(result.metrics.matchedTipoSociedad).toBe(true);
    expect(result.razonSocial).toBe("EL HORNERO");
    expect(result.tipoSociedad).toBe("S.R.L.");
    expect(result.socios).toContain("JUAN CARLOS PEREZ");
    expect(result.socios).toContain("MARIA GOMEZ");
    expect(result.socios.length).toBe(2);
    expect(result.metrics.sociosCount).toBe(2);
  });

  it("should extract Razón Social and Tipo de Sociedad for SOCIEDAD ANONIMA", () => {
    const text =
      "CONSTRUCCIONES ARGENTINAS SOCIEDAD ANONIMA. Se hace saber que por Acta de Asamblea del 1/1/2023 se designó Presidente a Roberto Sanchez y Director Suplente a Marta Martinez.";
    const result = parseBoraNotice(text);

    expect(result.metrics.matchedRazonSocial).toBe(true);
    expect(result.metrics.matchedTipoSociedad).toBe(true);
    expect(result.razonSocial).toBe("CONSTRUCCIONES ARGENTINAS");
    expect(result.tipoSociedad).toBe("SOCIEDAD ANONIMA");
    // "Roberto Sanchez" should be extracted from designation
    expect(result.socios).toContain("Roberto Sanchez");
  });

  it("should extract Razón Social and Socios based on DNI/argentino context", () => {
    const text =
      "Constitución de sociedad: LOS TRES HERMANOS S.A.S. Socios: Carlos Tevez, argentino, nacido el 05/02/1984; y Lionel Messi, argentino.";
    const result = parseBoraNotice(text);

    expect(result.metrics.matchedRazonSocial).toBe(true);
    expect(result.metrics.matchedTipoSociedad).toBe(true);
    expect(result.razonSocial).toBe("LOS TRES HERMANOS");
    expect(result.tipoSociedad).toBe("S.A.S.");
    expect(result.socios).toContain("Carlos Tevez");
    expect(result.socios).toContain("Lionel Messi");
  });

  it("should gracefully return empty metrics when the text doesn't contain a valid Razón Social or Tipo", () => {
    const text =
      "Por la presente se comunica que el dia de la fecha se resolvio aprobar el balance general del ejercicio cerrado al 31 de diciembre.";
    const result = parseBoraNotice(text);

    expect(result.metrics.matchedRazonSocial).toBe(false);
    expect(result.metrics.matchedTipoSociedad).toBe(false);
    expect(result.razonSocial).toBeNull();
    expect(result.tipoSociedad).toBeNull();
    expect(result.socios.length).toBe(0);
    expect(result.metrics.sociosCount).toBe(0);
  });
});
