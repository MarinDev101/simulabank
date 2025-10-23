import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPlataforma } from '../headers/header-plataforma/header-plataforma';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HeaderPlataforma],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  currentTheme: 'light' | 'dark' = 'light';

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
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
