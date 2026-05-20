import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateStaffDTO } from '../types';
import { staffApi } from '../api/staffApi';

const STAFF_QUERY_KEY = ['staff'];
const STAFF_MEMBER_QUERY_KEY = (id: string) => ['staff', id];

export function useStaff() {
  return useQuery({
    queryKey: STAFF_QUERY_KEY,
    queryFn: () => staffApi.listStaff(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

export function useStaffMember(staffId: string) {
  return useQuery({
    queryKey: STAFF_MEMBER_QUERY_KEY(staffId),
    queryFn: () => staffApi.getStaff(staffId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!staffId,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffDTO) => staffApi.createStaff(data),
    onSuccess: (newStaff) => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
      queryClient.setQueryData(STAFF_MEMBER_QUERY_KEY(newStaff.id), newStaff);
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => staffApi.deleteStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
    },
  });
}

export function useResetPin() {
  return useMutation({
    mutationFn: ({ staffId, newPin }: { staffId: string; newPin: string }) =>
      staffApi.resetPin(staffId, newPin),
  });
}
