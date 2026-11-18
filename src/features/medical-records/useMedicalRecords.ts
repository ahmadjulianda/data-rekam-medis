import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveMedicalRecord,
  createMedicalRecord,
  getMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
} from '../../lib/repository'
import type { MedicalRecordInput } from '../../types'

export const recordKeys = {
  all: ['records'] as const,
  detail: (id: string) => ['records', id] as const,
}

export function useMedicalRecords(enabled = true) {
  return useQuery({ queryKey: recordKeys.all, queryFn: getMedicalRecords, enabled })
}

export function useMedicalRecord(id: string | undefined) {
  return useQuery({
    queryKey: recordKeys.detail(id ?? 'none'),
    queryFn: () => getMedicalRecord(id as string),
    enabled: Boolean(id),
  })
}

function useInvalidateRecords() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: recordKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
  }
}

export function useCreateMedicalRecord() {
  const invalidate = useInvalidateRecords()
  return useMutation({
    mutationFn: (input: MedicalRecordInput) => createMedicalRecord(input),
    onSuccess: invalidate,
  })
}

export function useUpdateMedicalRecord() {
  const invalidate = useInvalidateRecords()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<MedicalRecordInput> }) =>
      updateMedicalRecord(id, patch),
    onSuccess: invalidate,
  })
}

export function useArchiveMedicalRecord() {
  const invalidate = useInvalidateRecords()
  return useMutation({ mutationFn: (id: string) => archiveMedicalRecord(id), onSuccess: invalidate })
}
