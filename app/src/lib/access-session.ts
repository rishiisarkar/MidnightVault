/** Browser-only session markers after a successful gate proof. */

const ACCESS_PREFIX = "midnight_access:";
const LEGACY_ACCESS_PREFIX = ["privo", "ra_access:"].join("");

export type AccessSession = {
  gateId: string;
  contractId: string | null;
  txId: string;
  unlockedAt: number;
};

function key(gateId: string): string {
  return `${ACCESS_PREFIX}${gateId}`;
}

function legacyKey(gateId: string): string {
  return `${LEGACY_ACCESS_PREFIX}${gateId}`;
}

export function markGateUnlocked(session: AccessSession): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key(session.gateId), JSON.stringify(session));
  } catch {
    // sessionStorage may be unavailable
  }
}

export function getGateAccess(gateId: string): AccessSession | null {
  if (typeof window === "undefined") return null;
  try {
    const storageKey = key(gateId);
    const oldStorageKey = legacyKey(gateId);
    const raw = window.sessionStorage.getItem(storageKey) ?? window.sessionStorage.getItem(oldStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AccessSession>;
    if (parsed.gateId !== gateId || typeof parsed.txId !== "string") return null;
    const migrated = {
      gateId: parsed.gateId,
      contractId: typeof parsed.contractId === "string" ? parsed.contractId : null,
      txId: parsed.txId,
      unlockedAt: typeof parsed.unlockedAt === "number" ? parsed.unlockedAt : Date.now(),
    };
    if (!window.sessionStorage.getItem(storageKey)) {
      window.sessionStorage.setItem(storageKey, JSON.stringify(migrated));
      window.sessionStorage.removeItem(oldStorageKey);
    }
    return migrated;
  } catch {
    return null;
  }
}

export function clearGateAccess(gateId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key(gateId));
    window.sessionStorage.removeItem(legacyKey(gateId));
  } catch {
    // ignore
  }
}
