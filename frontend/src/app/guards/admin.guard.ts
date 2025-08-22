import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    // placeholder: check role
    const token = this.auth.getToken();
    const isAdmin = token && token.includes('admin');
    if (isAdmin) return true;
    this.router.navigate(['/']);
    return false;
  }
}
