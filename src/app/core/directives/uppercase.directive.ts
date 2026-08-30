import { Directive, ElementRef, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * `appUppercase` — escribe el valor en MAYUSCULAS en el control.
 *
 * Por que existe: `class="uppercase"` en el input solo cambia la
 * presentacion visual, NO el valor del `FormControl`. Resultado:
 * el usuario escribe `mat`, ve `MAT`, pero `Validators.pattern(/^[A-Z]{3}$/)`
 * falla porque el valor real esta en minusculas. El backend
 * (`folioPrefixToUpper`) ya normaliza, asi que esta directiva
 * arregla la validacion del front y elimina la queja del usuario.
 */
@Directive({
  selector: '[appUppercase]',
  host: {
    input: 'onInput($event)',
    paste: 'onPaste($event)',
  },
})
export class UppercaseDirective {
  private el = inject(ElementRef<HTMLInputElement>);
  private ngControl = inject(NgControl, { optional: true });

  readonly maxLength = input<number>(0);

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    event.preventDefault();
    const upper = this.apply(text.toUpperCase());
    if (upper) this.writeValue(upper);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.writeValue(this.apply(target.value.toUpperCase()));
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
