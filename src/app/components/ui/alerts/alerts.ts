import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../../core/services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.html',
  styles: [`
    .alert-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    }
    .alert-item {
      pointer-events: auto;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      animation: slideIn 0.3s ease-out forwards;
      background-color: white;
      border-left: 4px solid;
    }
    .alert-item.success { border-left-color: #10b981; }
    .alert-item.error { border-left-color: #ef4444; }
    .alert-item.warning { border-left-color: #f59e0b; }
    .alert-item.info { border-left-color: #3b82f6; }
    
    .alert-content {
      flex: 1;
    }
    
    .alert-message {
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
    }
    
    .alert-close {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
    }
    .alert-close:hover {
      color: #4b5563;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    .alert-item.removing {
      animation: fadeOut 0.3s ease-out forwards;
    }
    
    :host-context(.dark) .alert-item {
      background-color: #1f2937;
    }
    :host-context(.dark) .alert-message {
      color: #e5e7eb;
    }
  `]
})
export class AlertsComponent implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  private subscription: Subscription | null = null;

  constructor(
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.alertService.alerts$.subscribe(alert => {
      this.alerts.push(alert);
      this.cdr.detectChanges();
      setTimeout(() => {
        this.removeAlert(alert);
      }, 5000);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeAlert(alert: Alert) {
    const element = document.getElementById('alert-' + alert.id);
    if (element) {
      element.classList.add('removing');
      setTimeout(() => {
        this.alerts = this.alerts.filter(a => a.id !== alert.id);
        this.cdr.detectChanges();
      }, 300);
    } else {
      this.alerts = this.alerts.filter(a => a.id !== alert.id);
      this.cdr.detectChanges();
    }
  }
}
