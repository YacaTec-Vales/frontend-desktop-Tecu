export const environment = {
  production: false,
  // Dev: usa el proxy de Angular (proxy.conf.json) -> utete.ddns.net:45000 (backend dev en casa)
  apiUrl: '/api/v1',
  // Vacía = captcha apagado en local. Pegar aquí la site key (o la
  // clave de prueba de Google) para probar contra un backend con
  // RECAPTCHA_ENABLED=true.
  recaptchaSiteKey: ''
};
