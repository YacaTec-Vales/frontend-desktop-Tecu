import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { recaptchaInterceptor } from './core/interceptors/recaptcha.interceptor';
import { rateLimitInterceptor } from './core/interceptors/rate-limit.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([rateLimitInterceptor, authInterceptor, recaptchaInterceptor, errorInterceptor])
    )
  ],
};
