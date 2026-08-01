import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'error' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() onClick = new EventEmitter<Event>();

  get classes(): string {
    // Desktop optimizations: tighter transitions for mouse, ring on focus-visible
    const base = 'font-bold rounded-lg focus:outline-none focus-visible:ring-4 transition-colors flex items-center justify-center gap-2';
    const widthClass = this.fullWidth ? 'w-full' : '';
    const disabledClass = this.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-px active:translate-y-0 shadow-sm hover:shadow';
    
    let variantClass = '';
    switch (this.variant) {
      case 'primary':
        variantClass = 'text-white bg-brand hover:bg-brand-strong focus-visible:ring-brand';
        break;
      case 'secondary':
        variantClass = 'text-gray-900 bg-gray-100 hover:bg-gray-200 focus-visible:ring-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600';
        break;
      case 'outline':
        variantClass = 'text-brand bg-transparent border border-brand hover:bg-brand-50 focus-visible:ring-brand-200 dark:hover:bg-gray-800';
        break;
      case 'error':
        variantClass = 'text-white bg-red-600 hover:bg-red-700 focus-visible:ring-red-300';
        break;
      case 'text':
        // No shadow or background initially, useful for subtle actions
        variantClass = 'text-gray-600 hover:text-brand hover:bg-gray-50 focus-visible:ring-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 shadow-none border border-transparent';
        break;
    }

    let sizeClass = '';
    switch (this.size) {
      case 'sm':
        sizeClass = 'px-3 py-1.5 text-xs'; // More compact for desktop tables
        break;
      case 'md':
        sizeClass = 'px-4 py-2 text-sm';
        break;
      case 'lg':
        sizeClass = 'px-5 py-2.5 text-base';
        break;
    }

    // Override shadow for text variant
    const finalDisabledClass = this.variant === 'text' && !this.disabled ? 'hover:-translate-y-px' : disabledClass;

    return `${base} ${variantClass} ${sizeClass} ${widthClass} ${finalDisabledClass}`;
  }

  handleClick(event: Event) {
    if (!this.disabled) {
      this.onClick.emit(event);
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
