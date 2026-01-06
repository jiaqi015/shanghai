
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

export interface CharacterLook {
  status: AssetStatus;
  seedPrompt: string;
  refImageUrl?: string;
  consistencyTags: string[];
}

export interface Character {
  id: string;
  name: string;
  roleInStory: string;
  coreTraits: string[];
  taboos: string[];
  look: CharacterLook;
}

export interface Scene {
  id: string;
  type: string;
  description: string;
  stylePreset?: string;
}

export interface ShotCasting {
  characterId: string;
  expression: string;
  action: string;
}

export interface Shot {
  id: string;
  order: number;
  beatPurpose: string;
  camera: string;
  action: string;
  dialogue?: string;
  sceneId: string;
  casting: ShotCasting[];
  imageUrl?: string;
  status: ShotStatus;
}

export interface Project {
  id: string;
  title: string;
  scriptText: string;
  characters: Character[];
  shots: Shot[];
  scenes: Scene[];
}
