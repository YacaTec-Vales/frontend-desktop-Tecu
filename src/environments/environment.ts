export const environment = {
  production: true,
  // Fallback: apunta a infra (api.taquizaschavez.com.mx). En dev usa environment.development.ts.
  apiUrl: 'https://yacatecc.devas-projects.sbs/api/v1',
  // Clave pública del sitio reCAPTCHA v3 (Google reCAPTCHA Admin).
  // Un solo par de llaves cubre los dominios tecu/calipx/poch.
  // Si queda vacía, el interceptor no adjunta x-recaptcha-token.
  recaptchaSiteKey: ''
};
