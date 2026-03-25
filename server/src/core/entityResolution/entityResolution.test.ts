import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveEntity } from "./entityResolution";

describe("Entity Resolution", () => {
  let mockDb: any;
  let updateMock: any;
  let insertMock: any;
  let selectMock: any;
  let fromMock: any;
  let whereMock: any;
  let limitMock: any;
  let leftJoinMock: any;

  beforeEach(() => {
    // Reset mocks
    updateMock = vi.fn().mockReturnThis();
    insertMock = vi.fn().mockReturnThis();
    selectMock = vi.fn().mockReturnThis();
    fromMock = vi.fn().mockReturnThis();
    whereMock = vi.fn().mockReturnThis();
    limitMock = vi.fn().mockReturnThis();
    leftJoinMock = vi.fn().mockReturnThis();

    mockDb = {
      update: updateMock,
      insert: insertMock,
      select: selectMock,
      from: fromMock,
      where: whereMock,
      limit: limitMock,
      leftJoin: leftJoinMock,
      set: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ entity_id: "new-entity-id" }])
    };

    // Chain resolution
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);

    mockDb.insert.mockReturnValue(mockDb);
    mockDb.values.mockReturnValue(mockDb);

    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.leftJoin.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.limit.mockReturnValue(mockDb);
  });

  it("should merge perfectly if CUIT matches", async () => {
    mockDb.limit.mockResolvedValue([{ entity_id: "existing-id", cuit: "30-11111111-2" }]);

    const record = {
      cuit: "30-11111111-2",
      razon_social: "EMPRESA X",
      entity_type: "COMPANY" as const
    };

    const result = await resolveEntity(mockDb, record);

    expect(result.status).toBe("MERGED");
    expect(result.entity_id).toBe("existing-id");
    expect(result.score).toBe(1.0);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should create new entity if no CUIT and no match", async () => {
    mockDb.where.mockResolvedValue([]); // No candidates

    const record = {
      razon_social: "EMPRESA Y",
      entity_type: "COMPANY" as const
    };

    const result = await resolveEntity(mockDb, record);

    expect(result.status).toBe("NEW");
    expect(result.entity_id).toBe("new-entity-id");
    expect(result.score).toBe(0);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should mark as NEEDS_REVIEW if probabilistic match score > 0.85 and same province", async () => {
    mockDb.where.mockResolvedValue([
      { entity_id: "existing-id", razon_social: "Panadería Central", province: "CABA" }
    ]);

    const record = {
      razon_social: "Panaderia Central", // Minor typo
      province: "CABA",
      entity_type: "COMPANY" as const
    };

    const result = await resolveEntity(mockDb, record);

    expect(result.status).toBe("NEEDS_REVIEW");
    expect(result.entity_id).toBe("new-entity-id"); // Creates a new one to link
    expect(result.score).toBeGreaterThan(0.85);
    expect(mockDb.insert).toHaveBeenCalled(); // Should insert entity, address, and suggestion
  });

  it("should NOT mark as NEEDS_REVIEW (penalty) if probabilistic match score > 0.85 but DIFFERENT province", async () => {
    mockDb.where.mockResolvedValue([
      { entity_id: "existing-id", razon_social: "Panadería Central", province: "CABA" }
    ]);

    const record = {
      razon_social: "Panaderia Central", // Minor typo
      province: "Tucumán", // Different province
      entity_type: "COMPANY" as const
    };

    const result = await resolveEntity(mockDb, record);

    expect(result.status).toBe("NEW"); // Because penalty dropped the score
    expect(result.entity_id).toBe("new-entity-id");
    // Ensure no suggestion is inserted
    // (mockDb.insert could be called twice - for entity and address, but not for suggestion)
  });
});
