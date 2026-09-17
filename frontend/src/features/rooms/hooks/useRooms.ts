import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/features/rooms/services/roomsApi';
import type { ListRoomParams } from '@/features/rooms/services/roomsApi';
import type { RoomCreate, RoomUpdate } from '@/types/api';

function unwrap<T>(promise: Promise<{ data: T }>) {
  return promise.then((r) => r.data);
}

export function useRooms(params?: ListRoomParams) {
  return useQuery({
    queryKey: ['rooms', params ?? {}],
    queryFn: () => unwrap(roomsApi.list(params)),
  });
}

export function useCreateRoom(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RoomCreate) => unwrap(roomsApi.create(data)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rooms'] });
      onSuccess?.();
    },
  });
}

export function useUpdateRoom(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoomUpdate }) => unwrap(roomsApi.update(id, data)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rooms'] });
      void qc.invalidateQueries({ queryKey: ['leases'] });
      onSuccess?.();
    },
  });
}