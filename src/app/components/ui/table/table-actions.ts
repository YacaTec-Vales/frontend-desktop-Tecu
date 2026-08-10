import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-table-actions',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="flex gap-2">
      <!-- Edit Button -->
      <app-button *ngIf="showEdit" variant="warning" size="sm" title="Editar" data-action="edit" [attr.data-id]="id">
        <svg class="w-4 h-4 pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.779 17.779 4.36 19.918 6.5 13.5m4.279 4.279 8.364-8.643a3.027 3.027 0 0 0-2.14-5.165 3.03 3.03 0 0 0-2.14.886L6.5 13.5m4.279 4.279L6.499 13.5m2.14 2.14 6.213-6.504M12.75 7.04 17 11.28"/>
        </svg>
      </app-button>
      
      <!-- Deactivate/Delete Button -->
      <app-button *ngIf="showDeactivate" variant="error" size="sm" [title]="deactivateTitle" data-action="deactivate" [attr.data-id]="id">
        <svg class="w-4 h-4 pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
        </svg>
      </app-button>
    </div>
  `
})
export class TableActionsComponent {
  @Input({ required: true }) id!: string;
  @Input() showEdit = true;
  @Input() showDeactivate = true;
  @Input() deactivateTitle = 'Desactivar';
}
