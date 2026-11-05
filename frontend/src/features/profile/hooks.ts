import { useMutation } from '@tanstack/react-query';
import { updateMe } from '../../lib/api/endpoints';
import type { ProfileInput } from '../../lib/api/types';

export const useUpdateProfile = () => useMutation({ mutationFn: (input: ProfileInput) => updateMe(input) });
