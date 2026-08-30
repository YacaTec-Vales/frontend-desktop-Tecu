import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
} from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * `appOnlyDigits` — bloquea cualquier tecla que no sea 0-9 en el
 * flujo de teclado y sanea el `value` en cada `input` y `paste`
 * para evitar pegar letras. Se aplica como atributo:
 *
 *   <input appOnlyDigits formControlName="phone" />
 *
 * Tambien escribe el valor saneado al `NgControl` para que la
 * validacion vea solo digitos (si el caller no usa `ngModel` /
 * `formControlName`, no rompe: solo limpia el DOM).
 *
 * Cumple con AGENTS.md: ninguna logica en `host` requiere
 * `@HostBinding` ni `@HostListener` — todo se hace via el objeto
 * `host` del decorator.
 */
@Directive({
  selector: '[appOnlyDigits]',
  host: {
    input: 'onInput($event)',
    paste: 'onPaste($event)',
    keydown: 'onKeydown($event)',
  },
})
export class OnlyDigitsDirective {
  private el = inject(ElementRef<HTMLInputElement>);
  private ngControl = inject(NgControl, { optional: true });

  /** Longitud maxima en digitos. 0 = sin limite. */
  readonly maxLength = input<number>(0);

  onKeydown(event: KeyboardEvent): void {
    if (this.isAllowedControlKey(event)) return;
    const isDigit = /^[0-9]$/.test(event.key);
    if (!isDigit) event.preventDefault();
  }

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^[0-9]+$/.test(text)) {
      event.preventDefault();
      const cleaned = text.replace(/\D/g, '');
      if (cleaned) this.writeValue(cleaned);
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const cleaned = target.value.replace(/\D/g, '');
    this.writeValue(cleaned);
  }

  private writeValue(value: string): void {
    const input = this.el.nativeElement;
    const limited =
      this.maxLength() > 0 ? value.slice(0, this.maxLength()) : value;
    if (input.value !== limited) input.value = limited;
    const ctrl = this.ngControl?.control;
    if (ctrl && ctrl.value !== limited) {
      ctrl.setValue(limited, { emitEvent: true });
    }
  }

  private isAllowedControlKey(e: KeyboardEvent): boolean {
    return (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
    );
  }
}
