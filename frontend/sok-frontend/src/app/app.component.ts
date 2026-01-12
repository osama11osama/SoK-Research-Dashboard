import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'SoK Research Dashboard';
  private themeService = inject(ThemeService);

  ngOnInit() {
    // Initialize theme on app start
    this.themeService.getCurrentTheme();
  }
}
