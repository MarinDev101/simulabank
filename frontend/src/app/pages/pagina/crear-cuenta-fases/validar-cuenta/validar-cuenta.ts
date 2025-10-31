import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-validar-cuenta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validar-cuenta.html',
})
export class ValidarCuenta implements OnInit {
  pinForm!: FormGroup;
  pinControls = Array(6);

  @ViewChild('inputsContainer') inputsContainer!: ElementRef<HTMLDivElement>;

  @Output() volver = new EventEmitter<void>();
  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    const group: any = {};
    for (let i = 0; i < 6; i++) {
      group[`digit${i}`] = ['', [Validators.pattern('[0-9]')]];
    }
    this.pinForm = this.fb.group(group);
  }

  onInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!/^[0-9]$/.test(value)) {
      input.value = '';
      this.pinForm.get(`digit${index}`)?.setValue('');
      return;
    }

    if (value && index < 5) {
      const next = this.inputsContainer.nativeElement.children[index + 1] as HTMLInputElement;
      next?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (input.value) {
        event.preventDefault();
        input.value = '';
        this.pinForm.get(`digit${index}`)?.setValue('');
      } else if (!input.value && index > 0) {
        event.preventDefault();
        const prev = this.inputsContainer.nativeElement.children[index - 1] as HTMLInputElement;
        prev?.focus();
        prev.value = '';
        this.pinForm.get(`digit${index - 1}`)?.setValue('');
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      const prev = this.inputsContainer.nativeElement.children[index - 1] as HTMLInputElement;
      prev?.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      const next = this.inputsContainer.nativeElement.children[index + 1] as HTMLInputElement;
      next?.focus();
    }
  }

  /** Mejorado: reparte el código pegado y mueve el foco al último input con valor */
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') || '';
    const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('');

    const inputs = this.inputsContainer.nativeElement.querySelectorAll('input');
    digits.forEach((d, i) => {
      if (i < 6) {
        this.pinForm.get(`digit${i}`)?.setValue(d);
        (inputs[i] as HTMLInputElement).value = d;
      }
    });

    const lastFilledIndex = Math.min(digits.length, 6) - 1;
    if (lastFilledIndex >= 0) {
      (inputs[lastFilledIndex] as HTMLInputElement)?.focus();
    }
  }

  verificarCodigo() {
    const codigo = Object.values(this.pinForm.value).join('');
    if (codigo.length === 6) {
      console.log('Código ingresado:', codigo);
    } else {
      console.log('Código incompleto');
    }
  }

  emitirVolver() {
    this.volver.emit();
  }
}
