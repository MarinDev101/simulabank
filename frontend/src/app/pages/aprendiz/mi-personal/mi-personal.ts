import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-mi-personal',
  imports: [CommonModule],
  templateUrl: './mi-personal.html',
})
export class MiPersonal {
  // En el componente TS
  selectedValue = 5;
  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectValue(value: number, event: Event) {
    this.selectedValue = value;
    this.isOpen = false;

    // Quita el foco del elemento activo para que la dropdown deje de estar "focused"
    const active = document.activeElement as HTMLElement | null;
    if (active) {
      active.blur();
    }

    // Si quieres emitir un valor:
    // this.itemsPerPageChange.emit(value);
  }
}
