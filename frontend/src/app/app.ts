import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import { SeoService } from './services/seo/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingOverlayComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected title = 'frontend';

  constructor(private seoService: SeoService) {}

  ngOnInit() {
    this.seoService.initSeoTracking();
  }
}
