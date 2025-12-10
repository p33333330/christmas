const DB_NAME = "GrandTreeDB_v16";
let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('photos')) {
        d.createObjectStore('photos', { keyPath: "id" });
      }
    };
    request.onsuccess = (e: any) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = () => resolve(null);
  });
};

export const savePhoto = (base64: string): Promise<string | null> => {
  if (!db) return Promise.resolve(null);
  return new Promise((resolve) => {
    const tx = db!.transaction('photos', "readwrite");
    const id = Date.now() + Math.random().toString();
    tx.objectStore('photos').add({ id, data: base64 });
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => resolve(null);
  });
};

export const loadPhotos = (): Promise<any[]> => {
  if (!db) return Promise.resolve([]);
  return new Promise((resolve) => {
    const tx = db!.transaction('photos', "readonly");
    const req = tx.objectStore('photos').getAll();
    req.onsuccess = (e: any) => resolve(e.target.result);
    req.onerror = () => resolve([]);
  });
};

export const deletePhoto = (id: string): void => {
  if (db) db.transaction('photos', "readwrite").objectStore('photos').delete(id);
};

export const clearPhotos = (): Promise<void> => {
  if (!db) return Promise.resolve();
  return new Promise((resolve) => {
    const tx = db!.transaction('photos', "readwrite");
    tx.objectStore('photos').clear();
    tx.oncomplete = () => resolve();
  });
};
