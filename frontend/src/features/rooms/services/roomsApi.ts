import apiClient from '@/services/api';
import type { PaginatedResponse, QueryParams, Room, RoomCreate, RoomUpdate } from '@/types/api';

export interface ListRoomParams extends QueryParams {
  house_id?: number;
}

export const roomsApi = {
  list: (params?: ListRoomParams) =>
    apiClient.get<PaginatedResponse<Room>>('/api/v1/rooms', { params }),
  get: (id: number) => apiClient.get<Room>(`/api/v1/rooms/${id}`),
  create: (data: RoomCreate) => apiClient.post<Room>('/api/v1/rooms', data),
  update: (id: number, data: RoomUpdate) =>
    apiClient.put<Room>(`/api/v1/rooms/${id}`, data),
};