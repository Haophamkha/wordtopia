import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/stats';

export const useOverview = () =>
  useQuery({ queryKey: ['stats', 'overview'], queryFn: statsApi.overview });

export const useWeekly = () =>
  useQuery({ queryKey: ['stats', 'weekly'], queryFn: statsApi.weekly });