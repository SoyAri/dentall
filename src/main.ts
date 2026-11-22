import { bootstrapApplication } from '@angular/platform-browser';
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// Monitoreo en producción/staging (Vercel): visitas, páginas vistas y
// Core Web Vitals reales de los usuarios (LCP, INP, CLS, TTFB, FCP).
const esLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
if (environment.production && !esLocal) {
  injectAnalytics({ mode: 'production' });
  injectSpeedInsights();
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
