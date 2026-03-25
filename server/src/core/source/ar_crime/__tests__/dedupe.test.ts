import { makeDedupeKey } from '../dedupe/dedupe';

describe('dedupe', () => {
  it('should generate deterministic keys', () => {
    const key1 = makeDedupeKey('Title A', 'Location B', '2023-10-01T10:00:00Z');
    const key2 = makeDedupeKey('Title A', 'Location B', '2023-10-01T10:00:00Z');
    const key3 = makeDedupeKey('Title B', 'Location B', '2023-10-01T10:00:00Z');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });
});
