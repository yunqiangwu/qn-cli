import { resetToken } from '../utils/token';

export interface LoginOptions {
  ak: string;
  sk: string;
}

export const reset = async (options: LoginOptions) => {
  await resetToken(options);
}
