import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPatient,
  deletePatient,
  getPatient,
  getPatients,
  updatePatient,
} from '../../lib/repository'
import type { PatientInput } from '../../types'

export const patientKeys = {
  all: ['patients'] as const,
  detail: (id: string) => ['patients', id] as const,
}

export function usePatients(enabled = true) {
  return useQuery({ queryKey: patientKeys.all, queryFn: getPatients, enabled })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: patientKeys.detail(id ?? 'none'),
    queryFn: () => getPatient(id as string),
    enabled: Boolean(id),
  })
}

function useInvalidatePatients() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: patientKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['records'] })
    void queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
  }
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatients()
  return useMutation({ mutationFn: (input: PatientInput) => createPatient(input), onSuccess: invalidate })
}

export function useUpdatePatient() {
  const invalidate = useInvalidatePatients()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<PatientInput> }) => updatePatient(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeletePatient() {
  const invalidate = useInvalidatePatients()
  return useMutation({ mutationFn: (id: string) => deletePatient(id), onSuccess: invalidate })
}
