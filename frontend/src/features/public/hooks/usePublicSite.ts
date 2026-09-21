import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../services/publicApi';

export function usePublicSite() {
  return useQuery({
    queryKey: ['public', 'site'],
    queryFn: () => publicApi.getSite().then((r) => r.data),
  });
}

export function usePublicProjects(featuredOnly = false) {
  return useQuery({
    queryKey: ['public', 'projects', featuredOnly],
    queryFn: () => publicApi.getProjects(featuredOnly).then((r) => r.data),
  });
}

export function usePublicProject(id: number | undefined) {
  return useQuery({
    queryKey: ['public', 'project', id],
    queryFn: () => publicApi.getProject(id as number).then((r) => r.data),
    enabled: id != null,
  });
}

export function usePublicHouses() {
  return useQuery({
    queryKey: ['public', 'houses'],
    queryFn: () => publicApi.getHouses().then((r) => r.data),
  });
}