// Shared, deterministic city layout used by the 3D world AND the 2D radar,
// so what you see on the minimap always matches what is rendered.

import { CityId } from './types';

export const WORLD_HALF = 90; // playable city spans [-90, 90] on X and Z
export const ROAD_LINES = [-60, -20, 20, 60]; // road centre lines (both axes)
export const ROAD_WIDTH = 10;
export const BLOCK_CENTERS = [-80, -40, 0, 40, 80];
export const INNER_BLOCKS = [-40, 0, 40];
export const SIDEWALK_INSET = 4; // buildings stay this far inside the block edge

export const STREETS_NS: Record<number, string> = {
  [-60]: 'Third Mainland Bridge / Herbert Macaulay',
  [-20]: 'Ikorodu Rd / Funsho Williams Ave',
  [20]: 'Kingsway Rd / Awolowo Rd (Ikoyi)',
  [60]: 'Ozumba Mbadiwe / Lekki-Ikoyi Link',
};

export const STREETS_EW: Record<number, string> = {
  [-60]: 'Marina Expwy & Eko Atlantic Coast',
  [-20]: 'Broad Street / Ahmadu Bello Way (VI)',
  [20]: 'Obafemi Awolowo Way / Allen Ave (Ikeja)',
  [60]: 'Airport Rd (LOS) / Lekki-Epe Expwy',
};

export const ABUJA_STREETS_NS: Record<number, string> = {
  [-60]: 'Nnamdi Azikiwe Expwy (Ring Rd 1)',
  [-20]: 'Murtala Mohammed Expwy (Kubwa Hwy)',
  [20]: 'Adetokunbo Ademola Cres (Wuse II)',
  [60]: 'Aguiyi Ironsi St / Three Arms Zone (Maitama)',
};

export const ABUJA_STREETS_EW: Record<number, string> = {
  [-60]: 'Jabi Lake Shore Drive',
  [-20]: 'Shehu Shagari Way (Central Business Dist)',
  [20]: 'Aminu Kano Crescent (Wuse II)',
  [60]: 'Umaru Musa Yar’Adua Expwy (Airport Rd ABV)',
};

export function getCityStreets(city: CityId = 'lagos') {
  return {
    ns: city === 'abuja' ? ABUJA_STREETS_NS : STREETS_NS,
    ew: city === 'abuja' ? ABUJA_STREETS_EW : STREETS_EW,
    waterfront: city === 'abuja' ? 'Jabi Lake Waterfront' : 'Lagos Lagoon & Bar Beach',
  };
}

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface BuildingSpec extends AABB {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: number;
  lit: number; // 0..1 share of windows lit at night
}

export interface Address {
  name: string;
  x: number;
  z: number;
}

/** min/max extent of a block centred on c */
export function blockBounds(c: number): [number, number] {
  if (c === -80) return [-WORLD_HALF, -65];
  if (c === 80) return [65, WORLD_HALF];
  return [c - 15, c + 15];
}

// Small seeded PRNG so the city is identical on every load
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUILDING_PALETTE = [0x334155, 0x475569, 0x1e3a5f, 0x3f3f46, 0x57534e, 0x44403c, 0x1f2937, 0x52525b];

/**
 * Generate generic filler buildings for every block that is NOT reserved for a landmark.
 * `reserved` holds "bx,bz" keys.
 */
export function generateFillerBuildings(reserved: Set<string>): BuildingSpec[] {
  const rand = mulberry32(1337);
  const out: BuildingSpec[] = [];

  for (const bx of BLOCK_CENTERS) {
    for (const bz of BLOCK_CENTERS) {
      const key = `${bx},${bz}`;
      if (reserved.has(key)) continue;
      // Waterfront row (south edge) stays open as a park/promenade
      if (bz === -80) continue;

      const [x0, x1] = blockBounds(bx);
      const [z0, z1] = blockBounds(bz);
      const ix0 = x0 + SIDEWALK_INSET;
      const ix1 = x1 - SIDEWALK_INSET;
      const iz0 = z0 + SIDEWALK_INSET;
      const iz1 = z1 - SIDEWALK_INSET;

      // Split the block into a 2x2 grid of lots
      const midX = (ix0 + ix1) / 2;
      const midZ = (iz0 + iz1) / 2;
      const lots: [number, number, number, number][] = [
        [ix0, midX - 1, iz0, midZ - 1],
        [midX + 1, ix1, iz0, midZ - 1],
        [ix0, midX - 1, midZ + 1, iz1],
        [midX + 1, ix1, midZ + 1, iz1],
      ];

      const isEdge = Math.abs(bx) === 80 || Math.abs(bz) === 80;
      for (const [lx0, lx1, lz0, lz1] of lots) {
        if (rand() < 0.12) continue; // leave an empty plot / courtyard
        const w = lx1 - lx0 - rand() * 1.5;
        const d = lz1 - lz0 - rand() * 1.5;
        const x = (lx0 + lx1) / 2;
        const z = (lz0 + lz1) / 2;
        const tall = rand() < 0.25 && !isEdge;
        const h = tall ? 26 + rand() * 22 : 7 + rand() * 14;
        out.push({
          x,
          z,
          w,
          d,
          h,
          color: BUILDING_PALETTE[Math.floor(rand() * BUILDING_PALETTE.length)],
          lit: 0.25 + rand() * 0.5,
          minX: x - w / 2,
          maxX: x + w / 2,
          minZ: z - d / 2,
          maxZ: z + d / 2,
        });
      }
    }
  }
  return out;
}

/** Nearest road line to a coordinate */
export function nearestRoad(v: number): number {
  let best = ROAD_LINES[0];
  for (const r of ROAD_LINES) if (Math.abs(r - v) < Math.abs(best - v)) best = r;
  return best;
}

export function getStreetName(x: number, z: number, city: CityId = 'lagos'): string {
  const rx = nearestRoad(x);
  const rz = nearestRoad(z);
  const dx = Math.abs(rx - x);
  const dz = Math.abs(rz - z);
  const { ns, ew, waterfront } = getCityStreets(city);
  if (z < -66) return waterfront;
  if (dx < 7 && dz < 7) return `${ns[rx]} / ${ew[rz]}`;
  if (dx < dz) return ns[rx];
  return ew[rz];
}

/** Sidewalk addresses used for deliveries, taxi fares and dispatch calls */
export function generateAddresses(city: CityId = 'lagos'): Address[] {
  const out: Address[] = [];
  let n = 4;
  for (const bx of INNER_BLOCKS) {
    for (const bz of INNER_BLOCKS) {
      const sides: [number, number][] = [
        [bx, bz - 13],
        [bx + 13, bz],
        [bx, bz + 13],
        [bx - 13, bz],
      ];
      for (const [x, z] of sides) {
        n += 7;
        out.push({ name: `${n} ${getStreetName(x, z, city).split(' / ')[0]}`, x, z });
      }
    }
  }
  return out;
}

/** Rectangular loop around an inner block, used for AI traffic (right-hand traffic) */
export function blockLoop(bx: number, bz: number, offset: number): [number, number][] {
  return [
    [bx - offset, bz - offset],
    [bx + offset, bz - offset],
    [bx + offset, bz + offset],
    [bx - offset, bz + offset],
  ];
}

/** Circle vs AABB overlap test (used for player / car collisions) */
export function circleHitsBox(x: number, z: number, r: number, b: AABB): boolean {
  const cx = Math.max(b.minX, Math.min(x, b.maxX));
  const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < r * r;
}
