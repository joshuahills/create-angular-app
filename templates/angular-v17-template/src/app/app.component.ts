import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [CommonModule, RouterOutlet, NgOptimizedImage],
})
export class AppComponent {
  title = 'angular-v17-template';
  currentYear = new Date().getFullYear();
}
