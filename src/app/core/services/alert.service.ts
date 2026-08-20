import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new Subject<Alert>();
  alerts$: Observable<Alert> = this.alertsSubject.asObservable();

  constructor() {}

  success(message: string) {
    this.addAlert('success', message);
  }

  error(message: string) {
    this.addAlert('error', message);
  }

  warning(message: string) {
    this.addAlert('warning', message);
  }

  info(message: string) {
    this.addAlert('info', message);
  }

  private addAlert(type: AlertType, message: string) {
    const alert: Alert = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message
    };
    this.alertsSubject.next(alert);
  }
}
