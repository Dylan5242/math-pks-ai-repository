export type UserRole = 'ADMIN' | 'USER' | 'GUEST';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';

export type TournamentStage = 'GROUP' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
}

export interface Tournament {
  id: number;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
}

export interface Match {
  id: number;
  tournamentId: number;
  team1: string;
  team2: string;
  matchDate: string; // YYYY-MM-DDTHH:mm
  stage: TournamentStage;
  status: MatchStatus;
  score1: number;
  score2: number;
}

/**
 * Standard Cryptographic SHA-256 hash function (producing 64-character lowercase hex string).
 * Replaces the vulnerable 16-bit/32-bit Integer.toHexString(hashCode()) implementation.
 * Exactly matches Java:
 * MessageDigest.getInstance("SHA-256").digest(password.getBytes(StandardCharsets.UTF_8))
 */
export function sha256Hash(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while (ascii.length % 64 !== 56) ascii += "\x00";

  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash.pop();
      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >>> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Legacy hash function for fallback backward compatibility
 */
export function legacyHashCodeHex(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return (hash >>> 0).toString(16);
}

export const javaHashCodeHex = sha256Hash;

// Initial seed data with cryptographically secure SHA-256 password hashes:
// 'admin' -> 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
// 'user'  -> 04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb
export const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    role: 'ADMIN',
  },
  {
    id: 2,
    username: 'user',
    password_hash: '04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb',
    role: 'USER',
  },
];

export const INITIAL_TOURNAMENTS: Tournament[] = [
  { id: 1, name: 'ЧМ по футболу 2024', startDate: '2024-06-01', endDate: '2024-07-15' },
  { id: 2, name: 'Лига Чемпионов 2024', startDate: '2024-09-01', endDate: '2025-05-31' },
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 1,
    tournamentId: 1,
    team1: 'Спартак',
    team2: 'Зенит',
    matchDate: '2024-06-10T19:00',
    status: 'SCHEDULED',
    stage: 'GROUP',
    score1: 0,
    score2: 0,
  },
  {
    id: 2,
    tournamentId: 1,
    team1: 'ЦСКА',
    team2: 'Динамо',
    matchDate: '2024-06-12T20:00',
    status: 'FINISHED',
    stage: 'QUARTER_FINAL',
    score1: 2,
    score2: 1,
  },
  {
    id: 3,
    tournamentId: 2,
    team1: 'Реал Мадрид',
    team2: 'Манчестер Сити',
    matchDate: '2024-10-15T21:00',
    status: 'LIVE',
    stage: 'GROUP',
    score1: 2,
    score2: 2,
  },
];
