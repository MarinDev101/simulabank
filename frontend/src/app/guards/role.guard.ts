import { Injectable } from '@angular/core';
import { CanActivateFn } from '@angular/router';

export const RoleGuard: CanActivateFn = (route, state) => {
  // implement role-based logic when needed
  return true;
};
