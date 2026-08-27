export const environment = {
  production: false,
  // Dev: Apunta directamente al servidor para no usar el proxy de Angular
  apiUrl: 'https://yacatecc.devas-projects.sbs/api/v1',
  // Vacía = captcha apagado en local. Pegar aquí la site key (o la
  // clave de prueba de Google) para probar contra un backend con
  // RECAPTCHA_ENABLED=true.
  recaptchaSiteKey: ''
};
