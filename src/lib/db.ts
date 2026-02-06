import Dexie, { type Table } from 'dexie';

export interface LocalChecklistItem {
    id: string; // UUID from Supabase
    audit_id: string;
    section: string;
    requirement: string;
    status: 'pending' | 'pass' | 'fail' | 'observation' | 'na';
    evidence_text?: string;
    is_dirty?: boolean; // True if modified locally and not synced
    updated_at?: string;
}

export class AuditDatabase extends Dexie {
    checklistItems!: Table<LocalChecklistItem, string>;

    constructor() {
        super('AuditDatabase');
        this.version(1).stores({
            checklistItems: 'id, audit_id, section, [audit_id+is_dirty]' // Compound index for sync
        });
    }
}

export const db = new AuditDatabase();
