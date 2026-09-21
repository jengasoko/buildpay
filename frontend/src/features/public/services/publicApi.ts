import apiClient from '@/services/api';
import type { PublicHouse, PublicProject, PublicSite } from '@/types/api';

export const publicApi = {
  getSite: () => apiClient.get<PublicSite>('/api/v1/public/site'),
  getProjects: (featuredOnly = false) =>
    apiClient.get<PublicProject[]>('/api/v1/public/projects', {
      params: featuredOnly ? { featured_only: true } : {},
    }),
  getProject: (id: number) => apiClient.get<PublicProject>(`/api/v1/public/projects/${id}`),
  getHouses: () => apiClient.get<PublicHouse[]>('/api/v1/public/houses'),
  getHouse: (id: number) => apiClient.get<PublicHouse>(`/api/v1/public/houses/${id}`),
};