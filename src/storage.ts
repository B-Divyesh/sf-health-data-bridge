import type { BridgeState, ImportReceipt, MappedRecord } from './types';

const DB_NAME = 'health-data-bridge';
const STORE = 'encrypted';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getValue<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

async function setValue(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function encryptionKey(): Promise<CryptoKey> {
  const saved = await getValue<CryptoKey>('device-key');
  if (saved) return saved;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await setValue('device-key', key);
  return key;
}

export async function loadLocalData(demo: boolean): Promise<{ receipts: ImportReceipt[]; importedIds: string[]; records: MappedRecord[] }> {
  if (demo) {
    const raw = sessionStorage.getItem('demo:bridge-state');
    return raw ? JSON.parse(raw) : { receipts: [], importedIds: [], records: [] };
  }
  const payload = await getValue<{ iv: number[]; data: number[] }>('receipts');
  if (!payload) return { receipts: [], importedIds: [], records: [] };
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(payload.iv) }, await encryptionKey(), new Uint8Array(payload.data));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return { receipts: [], importedIds: [], records: [] };
  }
}

export async function saveLocalData(demo: boolean, state: Pick<BridgeState, 'receipts' | 'importedIds'> & { records: MappedRecord[] }): Promise<void> {
  if (demo) {
    sessionStorage.setItem('demo:bridge-state', JSON.stringify(state));
    return;
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(state));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(), data);
  await setValue('receipts', { iv: [...iv], data: [...new Uint8Array(encrypted)] });
}

export function resetDemo(): void {
  sessionStorage.removeItem('demo:bridge-state');
  sessionStorage.removeItem('demo:custom-fields');
}
