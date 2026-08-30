import { Directive, ElementRef, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * `appOnlyLetters` — para nombres de persona. Acepta letras
 * Unicode (incluye acentos), espacios, guion y apostrofe.
 * Bloquea digitos y simbolos en teclado + paste + input.
 */
@Directive({
  selector: '[appOnlyLetters]',
  host: {
    input: 'onInput($event)',
    paste: 'onPaste($event)',
    keydown: 'onKeydown($event)',
  },
})
export class OnlyLettersDirective {
  private el = inject(ElementRef<HTMLInputElement>);
  private ngControl = inject(NgControl, { optional: true });

  readonly maxLength = input<number>(0);

  private static readonly ALLOWED_KEYS = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]);

  private static readonly ALLOWED_PUNCT = new Set([' ', '-', "'"]);

  onKeydown(event: KeyboardEvent): void {
    if (this.isMetaKey(event) || OnlyLettersDirective.ALLOWED_KEYS.has(event.key)) {
      return;
    }
    const ok = /^[\p{L}]$/u.test(event.key);
    if (!ok) event.preventDefault();
  }

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const cleaned = this.clean(text);
    event.preventDefault();
    if (cleaned) this.writeValue(cleaned);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.writeValue(this.clean(target.value));
  }

  private clean(value: string): string {
    const chars = Array.from(value);
    const filtered = chars.filter(
      (ch) => /^[\p{L}]$/u.test(ch) || OnlyLettersDirective.ALLOWED_PUNCT.has(ch),
    );
    let out = filtered.join('').replace(/\s+/g, ' ');
    if (this.maxLength() > 0) out = out.slice(0, this.maxLength());
    return out;
  }

  private writeValue(value: string): void {
    const input = this.el.nativeElement;
    if (input.value !== value) input.value = value;
    const ctrl = this.ngControl?.control;
    if (ctrl && ctrl.value !== value) {
      ctrl.setValue(value, { emitEvent: true });
    }
  }

  private isMetaKey(e: KeyboardEvent): boolean {
    return e.ctrlKey || e.metaKey || e.altKey;
  }
}
