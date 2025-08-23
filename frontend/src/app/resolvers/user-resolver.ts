import { ResolveFn } from '@angular/router';

export const userResolver: ResolveFn<boolean> = (route, state) => {
  return true;
};
