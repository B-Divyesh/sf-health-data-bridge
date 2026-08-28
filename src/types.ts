export type RecordKind = 'steps' | 'activeEnergy' | 'exercise' | 'weight';

export interface HealthRecord {
  id: string;
  type: RecordKind;
  startTime: string;
  endTime: string;
  value: number;
  unit: 'count' | 'kcal' | 'min' | 'kg';
  source: string;
}

export interface MappedRecord extends HealthRecord {
  localField: string;
}

export interface ImportReceipt {
  id: string;
  createdAt: string;
  dateFrom: string;
  dateTo: string;
  sourceCount: number;
  importedCount: number;
  duplicateCount: number;
  recordIds: string[];
  types: RecordKind[];
}

export interface BridgeState {
  source: HealthRecord[];
  filtered: HealthRecord[];
  selectedTypes: RecordKind[];
  dateFrom: string;
  dateTo: string;
  mapped: MappedRecord[];
  receipts: ImportReceipt[];
  importedIds: string[];
  lastReceipt?: ImportReceipt;
}
