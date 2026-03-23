import { Storage } from '@google-cloud/storage';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// --- L1: in-memory ---
const store = new Map();
const inflight = new Map();

// --- L2: Google Cloud Storage ---
let bucket = null;
const gcsBucket = process.env.GCS_CACHE_BUCKET;
if (gcsBucket) {
  try {
    const storage = new Storage();
    bucket = storage.bucket(gcsBucket);
    console.log(`GCS cache enabled: gs://${gcsBucket}`);
  } catch (err) {
    console.warn('GCS cache init failed, using in-memory only:', err.message);
  }
}

function gcsKey(key) {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
}

async function gcsGet(key) {
  if (!bucket) return null;
  try {
    const [data] = await bucket.file(gcsKey(key)).download();
    const entry = JSON.parse(data.toString());
    if (Date.now() > entry.expires) return null;
    return entry.value;
  } catch {
    return null; // file doesn't exist or read error
  }
}

function gcsSet(key, value, ttl) {
  if (!bucket) return;
  const payload = JSON.stringify({ value, expires: Date.now() + ttl });
  bucket.file(gcsKey(key)).save(payload, { resumable: false }).catch((err) => {
    console.warn(`GCS cache write failed for ${key}:`, err.message);
  });
}

// --- Public API ---

export async function get(key) {
  // L1
  const entry = store.get(key);
  if (entry) {
    if (Date.now() > entry.expires) {
      store.delete(key);
    } else {
      return entry.value;
    }
  }
  // L2
  const gcsValue = await gcsGet(key);
  if (gcsValue != null) {
    // Populate L1 with remaining TTL (use a conservative 5 min)
    store.set(key, { value: gcsValue, expires: Date.now() + DEFAULT_TTL });
    return gcsValue;
  }
  return null;
}

export function set(key, value, ttl = DEFAULT_TTL) {
  store.set(key, { value, expires: Date.now() + ttl });
  gcsSet(key, value, ttl);
}

export function flush(key) {
  store.delete(key);
  if (bucket) {
    bucket.file(gcsKey(key)).delete({ ignoreNotFound: true }).catch(() => {});
  }
}

export function flushAll() {
  store.clear();
}

/**
 * Deduplicated fetch: concurrent requests for the same key share one in-flight promise.
 */
export async function fetchWithCache(key, fetchFn, ttl = DEFAULT_TTL) {
  const cached = await get(key);
  if (cached) return cached;

  if (inflight.has(key)) return inflight.get(key);

  const promise = fetchFn().then((result) => {
    set(key, result, ttl);
    inflight.delete(key);
    return result;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}
