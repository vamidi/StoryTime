
import { redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
// const adminOnly = () => hasCustomClaim('admin');

export const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['auth/login']);
export const redirectLoggedInToDatabase = () => redirectLoggedInTo(['dashboard/']);
