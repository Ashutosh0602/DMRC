/* global self, indexedDB */
const DB_NAME = "loc-queue-db";
const STORE = "locations";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(STORE, { autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueLocation(item) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).add(item);
  return tx.complete;
}

async function flushQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const req = store.openCursor();
  const failed = [];
  return new Promise((resolve) => {
    req.onsuccess = async (e) => {
      const cursor = e.target.result;
      if (!cursor) {
        resolve(failed);
        return;
      }
      const value = cursor.value;
      try {
        const r = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        if (r.ok) {
          store.delete(cursor.key);
          cursor.continue();
        } else {
          failed.push(value);
          cursor.continue();
        }
      } catch {
        failed.push(value);
        cursor.continue();
      }
    };
  });
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (e) => {
  const { type, payload } = e.data || {};
  if (type === "ENQUEUE_LOCATION") {
    enqueueLocation(payload).catch(console.error);
    if (self.registration.sync) {
      self.registration.sync.register("sync-locations").catch(() => {});
    }
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-locations") {
    event.waitUntil(flushQueue());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "periodic-locations") {
    event.waitUntil(flushQueue());
  }
});
