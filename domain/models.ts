
export enum AssetStatus {
  DRAFT = 'Draft',
  LOCKED = 'Locked'
}

export enum ShotStatus {
  PENDING = 'Pending',
  GENERATING = 'Generating',
  COMPLETED = 'Completed',
  FAILED = 'Failed'
}

export interface Character {
  id: string;
  name: string;
  role: string;
  vibe: string;
  coreTraits: string[];
  status: AssetStatus;
  refImageUrl?: string;
}

export interface SubArea {
  id: string;
  name: string;
  description: string;
  refImageUrl?: string;
}

export interface LocationAsset {
  id: string;
  name: string;
  type: string;
  description: string;
  status: AssetStatus;
  refImageUrl?: string;
  subAreas: SubArea[];
}

export interface Shot {
  id: string;
  order: number;
  locationId: string;
  subAreaId?: string;
  camera: string;
  action: string;
  motionPrompt?: string;
  dialogue?: string;
  marketingPoint?: string;
  casting: { characterId: string; action: string }[];
  imageUrl?: string;
  status: ShotStatus;
}

export interface ProductionProject {
  id: string;
  title: string;
  scriptText: string;
  characters: Character[];
  locations: LocationAsset[];
  shots: Shot[];
  lastUpdated: number;
}
