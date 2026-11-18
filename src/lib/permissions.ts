import type { UserRole } from '../types'

export type Permission =
  | 'patients.view'
  | 'patients.manage'
  | 'patients.delete'
  | 'staff.manage'
  | 'records.view'
  | 'records.create'
  | 'records.editAll'
  | 'records.editDraftObjective'
  | 'records.archive'
  | 'prescriptions.view'
  | 'prescriptions.manage'
  | 'allergies.view'

const MATRIX: Record<Permission, UserRole[]> = {
  'patients.view': ['admin', 'doctor', 'nurse'],
  'patients.manage': ['admin', 'doctor', 'nurse'],
  'patients.delete': ['admin'],
  'staff.manage': ['admin'],
  'records.view': ['admin', 'doctor', 'nurse'],
  'records.create': ['doctor', 'nurse'],
  'records.editAll': ['doctor'],
  'records.editDraftObjective': ['nurse'],
  'records.archive': ['admin', 'doctor'],
  'prescriptions.view': ['admin', 'doctor', 'nurse', 'pharmacist'],
  'prescriptions.manage': ['doctor'],
  'allergies.view': ['admin', 'doctor', 'nurse', 'pharmacist'],
}

export function can(permission: Permission, role: UserRole | undefined): boolean {
  if (!role) return false
  return MATRIX[permission].includes(role)
}

/** Apakah peran boleh mengubah rekam medis ini? */
export function canEditRecord(
  role: UserRole | undefined,
  record: { status: string } | null,
): boolean {
  if (!role || !record) return false
  if (can('records.editAll', role)) return record.status !== 'archived'
  if (can('records.editDraftObjective', role)) return record.status === 'draft'
  return false
}
