import { useQuery } from '@tanstack/react-query'
import { getAllergyDirectory, getPharmacistPrescriptions } from '../../lib/repository'

export const pharmacistKeys = {
  allergies: ['allergy-directory'] as const,
  prescriptions: ['pharmacist-prescriptions'] as const,
}

export function useAllergyDirectory(enabled = true) {
  return useQuery({
    queryKey: pharmacistKeys.allergies,
    queryFn: getAllergyDirectory,
    enabled,
  })
}

export function usePharmacistPrescriptions(enabled = true) {
  return useQuery({
    queryKey: pharmacistKeys.prescriptions,
    queryFn: getPharmacistPrescriptions,
    enabled,
  })
}
