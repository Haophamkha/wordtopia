import { useQuery } from '@tanstack/react-query';
import { pathApi } from '../api/path';

export const usePath = () => useQuery({ queryKey: ['path'], queryFn: pathApi.get });