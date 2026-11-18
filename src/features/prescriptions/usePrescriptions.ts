import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPrescription,
  deletePrescription,
  getPrescriptions,
  updatePrescription,
} from '../../lib/repository'
import type { PrescriptionInput } from '../../types'

export const prescriptionKeys = { all: ['prescriptions'] as const }

export function usePrescriptions(enabled = true) {
  return useQuery({ queryKey: prescriptionKeys.all, queryFn: getPrescriptions, enabled })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: prescriptionKeys.all })
}

export function useCreatePrescription() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: PrescriptionInput) => createPrescription(input),
    onSuccess: invalidate,
  })
}

export function useUpdatePrescription() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<PrescriptionInput> }) =>
      updatePrescription(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeletePrescription() {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (id: string) => deletePrescription(id), onSuccess: invalidate })
}
