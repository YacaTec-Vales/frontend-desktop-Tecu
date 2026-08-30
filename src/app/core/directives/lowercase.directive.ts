import { Directive, ElementRef, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * `appLowercase` — escribe el valor en minusculas en el control.
 * Usado en `username` (el backend hace `trimLower` antes de
 * validar el regex `[a-z0-9._-]+`).
 */
@Directive({
  selector: '[appLowercase]',
  host: {
    input: 'onInput($event)',
    paste: 'onPaste($event)',
  },
})
export class LowercaseDirective {
  private el = inject(ElementRef<HTMLInputElement>);
  private ngControl = inject(NgControl, { optional: true });

  readonly maxLength = input<number>(0);

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    event.preventDefault();
    const lower = this.apply(text.toLowerCase());
    if (lower) this.writeValue(lower);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.writeValue(this.apply(target.value.toLowerCase()));
  }

  private apply(value: string): string {
    let v = value;
    if (this.maxLength() > 0) v = v.slice(0, this.maxLength());
    return v;
  }

  private writeValue(value: string): void {
    const input = this.el.nativeElement;
    if (input.value !== value) input.value = value;
    const ctrl = this.ngControl?.control;
    if (ctrl && ctrl.value !== value) {
      ctrl.setValue(value, { emitEvent: true });
    }
  }
}
