import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProfiles, updateProfile } from '../../lib/repository'
import type { Profile } from '../../types'

export const profileKeys = { all: ['profiles'] as const }

export function useProfiles(enabled = true) {
  return useQuery({ queryKey: profileKeys.all, queryFn: getProfiles, enabled })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: {
      id: string
      patch: Partial<Pick<Profile, 'full_name' | 'role' | 'specialization' | 'sip_number'>>
    }) => updateProfile(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
