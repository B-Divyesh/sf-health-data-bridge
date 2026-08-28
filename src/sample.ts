import type { HealthRecord } from './types';

export const sampleRecords: HealthRecord[] = [
  { id: 'hc-steps-0822', type: 'steps', startTime: '2026-08-22T07:10:00.000Z', endTime: '2026-08-22T20:30:00.000Z', value: 8432, unit: 'count', source: 'Pixel Watch' },
  { id: 'hc-energy-0822', type: 'activeEnergy', startTime: '2026-08-22T07:10:00.000Z', endTime: '2026-08-22T20:30:00.000Z', value: 514, unit: 'kcal', source: 'Pixel Watch' },
  { id: 'hc-weight-0823', type: 'weight', startTime: '2026-08-23T06:55:00.000Z', endTime: '2026-08-23T06:55:00.000Z', value: 71.8, unit: 'kg', source: 'OpenScale' },
  { id: 'hc-exercise-0823', type: 'exercise', startTime: '2026-08-23T17:15:00.000Z', endTime: '2026-08-23T17:52:00.000Z', value: 37, unit: 'min', source: 'Health Connect' },
  { id: 'hc-steps-0823', type: 'steps', startTime: '2026-08-23T06:55:00.000Z', endTime: '2026-08-23T21:10:00.000Z', value: 10911, unit: 'count', source: 'Pixel Watch' },
  { id: 'hc-energy-0823', type: 'activeEnergy', startTime: '2026-08-23T06:55:00.000Z', endTime: '2026-08-23T21:10:00.000Z', value: 648, unit: 'kcal', source: 'Pixel Watch' },
  { id: 'hc-weight-0824', type: 'weight', startTime: '2026-08-24T06:48:00.000Z', endTime: '2026-08-24T06:48:00.000Z', value: 71.6, unit: 'kg', source: 'OpenScale' },
  { id: 'hc-steps-0824', type: 'steps', startTime: '2026-08-24T06:48:00.000Z', endTime: '2026-08-24T20:42:00.000Z', value: 6210, unit: 'count', source: 'Pixel Watch' },
  { id: 'hc-energy-0824', type: 'activeEnergy', startTime: '2026-08-24T06:48:00.000Z', endTime: '2026-08-24T20:42:00.000Z', value: 403, unit: 'kcal', source: 'Pixel Watch' },
  { id: 'hc-exercise-0825', type: 'exercise', startTime: '2026-08-25T05:50:00.000Z', endTime: '2026-08-25T06:18:00.000Z', value: 28, unit: 'min', source: 'Health Connect' },
  { id: 'hc-steps-0825', type: 'steps', startTime: '2026-08-25T05:50:00.000Z', endTime: '2026-08-25T19:52:00.000Z', value: 7744, unit: 'count', source: 'Pixel Watch' },
  { id: 'hc-weight-0826', type: 'weight', startTime: '2026-08-26T07:02:00.000Z', endTime: '2026-08-26T07:02:00.000Z', value: 71.4, unit: 'kg', source: 'OpenScale' }
];
