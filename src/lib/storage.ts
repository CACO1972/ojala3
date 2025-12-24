export type StoredObject = { url: string; key: string };

export interface StorageProvider {
  put(params: { filename: string; contentType: string; bytes: ArrayBuffer }): Promise<StoredObject>;
}

// Stub (fase 1): no guarda, sólo devuelve placeholder.
export class StubStorageProvider implements StorageProvider {
  async put({ filename }: { filename: string; contentType: string; bytes: ArrayBuffer }): Promise<StoredObject> {
    return { key: `stub/${Date.now()}_${filename}`, url: "about:blank" };
  }
}

export function getStorageProvider(): StorageProvider {
  return new StubStorageProvider();
}
