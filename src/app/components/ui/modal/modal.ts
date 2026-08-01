import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html'
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' = 'md';
  
  @Output() onClose = new EventEmitter<void>();

  // Cerrar con la tecla ESC
  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    if (this.isOpen) {
      this.close();
    }
  }

  close() {
    this.onClose.emit();
  }

  // Prevenir que clics dentro del contenido del modal lo cierren
  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  get widthClass(): string {
    switch (this.maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      default: return 'max-w-md';
    }
  }
}
