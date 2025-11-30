import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-basico',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header-basico.html',
})
export class HeaderBasico {
  isDrawerOpen = false;

  @HostListener('window:resize')
  onResize(): void {
    // Breakpoint lg de Tailwind = 1024px
    if (window.innerWidth >= 1024 && this.isDrawerOpen) {
      this.closeDrawer();
    }
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }
}
