import { registerPlugin } from '@capacitor/core';
import type { HealthRecord, RecordKind } from './types';

interface HealthConnectPlugin {
  availability(): Promise<{ available: boolean; reason?: string }>;
  requestPermissions(options: { recordTypes: RecordKind[] }): Promise<{ granted: RecordKind[] }>;
  readRecords(options: { recordTypes: RecordKind[]; startTime: string; endTime: string }): Promise<{ records: HealthRecord[] }>;
}

export const HealthConnect = registerPlugin<HealthConnectPlugin>('HealthConnectBridge');
