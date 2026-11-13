/**
 * The cities the platform is born with (DECISIONS.md #390). Others enter through the owner's CRUD,
 * never here. The center is the town's; the box is the urban area the map opens on and the
 * geographic checks accept, not the municipality, whose limits reach hundreds of kilometers of
 * forest. The three towns of the Alto Solimões frontier keep the Acre clock (UTC-5), the
 * `America/Eirunepe` zone of the IANA database.
 */
export const SEED_CITIES = [
  {
    name: 'Benjamin Constant',
    state: 'AM',
    slug: 'benjamin-constant',
    timeZone: 'America/Eirunepe',
    latitude: -4.3831,
    longitude: -70.0311,
    south: -4.4,
    west: -70.06,
    north: -4.36,
    east: -70.0,
  },
  {
    name: 'Atalaia do Norte',
    state: 'AM',
    slug: 'atalaia-do-norte',
    timeZone: 'America/Eirunepe',
    latitude: -4.3717,
    longitude: -70.1917,
    south: -4.39,
    west: -70.21,
    north: -4.35,
    east: -70.17,
  },
  {
    name: 'Tabatinga',
    state: 'AM',
    slug: 'tabatinga',
    timeZone: 'America/Eirunepe',
    latitude: -4.2525,
    longitude: -69.9383,
    south: -4.28,
    west: -69.97,
    north: -4.21,
    east: -69.9,
  },
] as const
