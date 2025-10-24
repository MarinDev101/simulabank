import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPlataforma } from '../headers/header-plataforma/header-plataforma';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HeaderPlataforma, MatTooltipModule],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  currentTheme: 'light' | 'dark' = 'light';
  isDrawerClosed = false;

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.currentTheme = savedTheme;
      this.applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);
    }

    this.checkDrawerState();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleDrawer() {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    if (drawer) {
      drawer.click();
      setTimeout(() => this.checkDrawerState(), 0);
    }
  }

  checkDrawerState() {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    this.isDrawerClosed = !drawer?.checked;
  }

  // Método para determinar si mostrar tooltip (solo cuando drawer está cerrado en pantallas grandes)
  shouldShowTooltip(): boolean {
    return this.isDrawerClosed;
  }
}
