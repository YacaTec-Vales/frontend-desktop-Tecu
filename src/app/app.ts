import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertsComponent } from './components/ui/alerts/alerts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlertsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend-desktop-tecu');
}
