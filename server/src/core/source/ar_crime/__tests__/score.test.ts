import { computeConfidenceScore, computeSeverityScore } from '../score/scoring';

describe('scoring', () => {
  it('computes severity score deterministically', () => {
    const s1 = computeSeverityScore('homicide', 'asesinato en la calle');
    const s2 = computeSeverityScore('homicide', 'asesinato en la calle');
    const s3 = computeSeverityScore('robbery', 'robo menor');

    expect(s1).toBe(s2);
    expect(s1).toBeGreaterThan(s3);
  });

  it('computes confidence score deterministically', () => {
    const c1 = computeConfidenceScore({
      sourceReliability: 70,
      corroboratedSources: 2,
      geocodeConfidence: 80,
    });
    const c2 = computeConfidenceScore({
      sourceReliability: 70,
      corroboratedSources: 2,
      geocodeConfidence: 80,
    });

    expect(c1).toBe(c2);
    expect(c1).toBeGreaterThan(0);
  });
});
