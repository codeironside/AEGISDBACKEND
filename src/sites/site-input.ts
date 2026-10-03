export const kinds = [
  'entrance',
  'exit',
  'camera',
  'post',
  'assembly',
  'building',
  'restricted',
  'boundary',
  'route',
  'incident',
  'crowd',
] as const;
export type SiteKind = (typeof kinds)[number];
export type SiteFeature = {
  id: string;
  kind: SiteKind;
  name: string;
  coordinates: [number, number][];
  notes: string;
  verified: boolean;
  observedAt?: string;
  count?: number;
  updatedAt: string;
  source: 'user';
};
export type SiteInput = {
  name: string;
  latitude: number;
  longitude: number;
  locationLabel: string;
  features: SiteFeature[];
  plan: {
    purpose: string;
    risks: string;
    actions: string;
    assumptions: string;
  };
  cad?: { fileId: string; name: string };
  configuration?: WorkspaceConfiguration;
};
export type WorkspaceConfiguration = {
  mapView: 'orbit' | 'aps' | 'ortho' | 'heat' | 'gis' | 'environment';
  cadConfiguration: string;
  mapProvider: 'open-map' | 'google';
  phoneFeeds: Record<string, string>;
  cameraSource: string;
  twinView: 'map' | 'ai';
  twinPreset: 'rooftop' | 'compound';
  weatherView: 'street' | '3d';
  weatherHour: number;
};
export const defaultWorkspaceConfiguration: WorkspaceConfiguration = {
  mapView: 'gis', cadConfiguration: '', mapProvider: 'open-map', phoneFeeds: {}, cameraSource: 'video', twinView: 'map', twinPreset: 'rooftop', weatherView: 'street', weatherHour: 0,
};
export function parseConfiguration(value: unknown): WorkspaceConfiguration {
  const raw = { ...defaultWorkspaceConfiguration, ...object(value) };
  const sourceIds = ['video', 'thermal', 'optical', 'trevi', 'east-live', 'caldera', 'mux-480', 'mux-adaptive', 'atmosphere'];
  if (!['orbit', 'aps', 'ortho', 'heat', 'gis', 'environment'].includes(raw.mapView) || !['open-map', 'google'].includes(raw.mapProvider) || !sourceIds.includes(raw.cameraSource) || !['map', 'ai'].includes(raw.twinView) ||
      !['rooftop', 'compound'].includes(raw.twinPreset) || !['street', '3d'].includes(raw.weatherView) ||
      !Number.isInteger(raw.weatherHour) || raw.weatherHour < 0 || raw.weatherHour > 167)
    throw new Error('Please check workspace camera and viewer settings.');
  const cadConfiguration = text(raw.cadConfiguration, 262144);
  if (cadConfiguration) object(JSON.parse(cadConfiguration));
  const phones = object(raw.phoneFeeds);
  if (Object.keys(phones).length > 20 || Object.entries(phones).some(([metric, token]) => !/^[a-z0-9_-]{1,80}$/.test(metric) || typeof token !== 'string' || !/^[a-f0-9]{32}$/.test(token))) throw new Error('Invalid phone camera configuration.');
  return { mapView: raw.mapView, cadConfiguration, mapProvider: raw.mapProvider, phoneFeeds: phones as Record<string, string>, cameraSource: raw.cameraSource, twinView: raw.twinView, twinPreset: raw.twinPreset,
    weatherView: raw.weatherView, weatherHour: raw.weatherHour };
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Please provide a location record.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, required = false): string {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new Error('Please check the text fields and their lengths.');
  return value.trim();
}
function number(value: unknown, min: number, max: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error('Please check coordinates and observation counts.');
  return value;
}
export function parseSiteInput(
  value: unknown,
  now = new Date().toISOString(),
): SiteInput {
  const raw = object(value);
  if (!Array.isArray(raw.features) || raw.features.length > 500)
    throw new Error('A location supports up to 500 features.');
  const ids = new Set<string>();
  const features = raw.features.map((value): SiteFeature => {
    const f = object(value),
      id = text(f.id, 80, true),
      kind = f.kind as SiteKind;
    if (ids.has(id) || !kinds.includes(kind))
      throw new Error('Please check feature identifiers and categories.');
    ids.add(id);
    const polygon = ['building', 'restricted', 'boundary'].includes(kind),
      line = kind === 'route',
      minimum = polygon ? 3 : line ? 2 : 1;
    if (
      !Array.isArray(f.coordinates) ||
      f.coordinates.length < minimum ||
      f.coordinates.length > 200 ||
      (!polygon && !line && f.coordinates.length !== 1)
    )
      throw new Error('Please complete the marker, zone or route geometry.');
    const coordinates = f.coordinates.map((p): [number, number] => {
      if (!Array.isArray(p) || p.length !== 2)
        throw new Error('Please check feature coordinates.');
      return [number(p[0], -180, 180), number(p[1], -85, 85)];
    });
    if (
      minimum > 1 &&
      new Set(coordinates.map((p) => p.join(','))).size < minimum
    )
      throw new Error('Please use distinct points for a zone or route.');
    if (typeof f.verified !== 'boolean')
      throw new Error('Please choose a feature verification status.');
    const observation = kind === 'crowd' || kind === 'incident';
    let observedAt: string | undefined;
    if (observation) {
      if (
        typeof f.observedAt !== 'string' ||
        !Number.isFinite(Date.parse(f.observedAt))
      )
        throw new Error('Observations need a valid recorded time.');
      observedAt = new Date(f.observedAt).toISOString();
      if (Date.parse(observedAt) > Date.parse(now) + 60_000)
        throw new Error('Observation times cannot be in the future.');
    }
    const count = kind === 'crowd' ? number(f.count, 0, 1_000_000) : undefined;
    if (count !== undefined && !Number.isInteger(count))
      throw new Error('Crowd counts must be whole numbers.');
    return {
      id,
      kind,
      name: text(f.name, 160, true),
      coordinates,
      notes: text(f.notes ?? '', 2000),
      verified: f.verified,
      source: 'user',
      updatedAt: now,
      ...(observedAt ? { observedAt } : {}),
      ...(count !== undefined ? { count } : {}),
    };
  });
  const p = object(raw.plan);
  let cad: SiteInput['cad'];
  if (raw.cad !== undefined) {
    const c = object(raw.cad);
    cad = { fileId: text(c.fileId, 160, true), name: text(c.name, 260, true) };
  }
  return {
    name: text(raw.name, 160, true),
    latitude: number(raw.latitude, -85, 85),
    longitude: number(raw.longitude, -180, 180),
    locationLabel: text(raw.locationLabel ?? '', 300),
    features,
    configuration: parseConfiguration(raw.configuration ?? {}),
    plan: {
      purpose: text(p.purpose ?? '', 4000),
      risks: text(p.risks ?? '', 8000),
      actions: text(p.actions ?? '', 8000),
      assumptions: text(p.assumptions ?? '', 8000),
    },
    ...(cad ? { cad } : {}),
  };
}
