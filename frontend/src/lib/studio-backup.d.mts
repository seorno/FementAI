export interface StudioBatch {version:1;id:string;name:string;beverage:string;startedOn:string;stage:string;entries:{id:string;date:string;stage:string;note:string;gravity:number|null}[];recipeStatus:string}
export interface StudioMemory {version:1;id:string;batchId:string;date:string;intent:Record<string,number>;observed:Record<string,number>;nextTime:string;notes:string}
export interface StudioBackup {batches:StudioBatch[];entries:StudioMemory[];summary:{batches:number;observations:number;reflections:number;createdAt:string}}
export const BACKUP_VERSION:1;
export function makeBackup(journal:StudioBatch[],memory:StudioMemory[],createdAt?:string):string;
export function inspectBackup(input:string):StudioBackup;
export type RestoreBaseline = Record<string,string|null>;
export function captureRestoreBaseline(storage:Pick<Storage,'getItem'>):RestoreBaseline;
export function restoreBackup(storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,validated:StudioBackup,expectedBaseline:RestoreBaseline):StudioBackup['summary'];

export function exportStudioBackupStrict(storage:Pick<Storage,'getItem'>,createdAt?:string):string;
export function exportRawRecovery(storage:Pick<Storage,'getItem'>,createdAt?:string):string;
