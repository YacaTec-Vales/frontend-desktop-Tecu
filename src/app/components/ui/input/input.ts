import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'file';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: InputType = 'text';
  @Input() placeholder: string = '';
  @Input() hint: string = '';
  @Input() disabled: boolean = false;
  @Input() rows: number = 4; // Para textarea
  @Input() accept: string = ''; // Para file

  value: any = '';

  onChange: any = () => {};
  onTouch: any = () => {};

  writeValue(value: any): void {
    if (this.type !== 'file') {
      this.value = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: any) {
    if (this.type === 'file') {
      const file = event.target.files[0];
      this.value = file;
      this.onChange(file);
    } else {
      this.value = event.target.value;
      this.onChange(this.value);
    }
    this.onTouch();
  }

  get baseInputClasses(): string {
    // Desktop: Slightly tighter padding (`py-2`), clean borders, standard typography.
    return `w-full text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-brand focus:border-brand dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-brand-light dark:focus:border-brand-light transition-colors text-sm sm:text-base py-2 px-3
      ${this.disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`;
  }
}
