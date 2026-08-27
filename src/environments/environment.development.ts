export const environment = {
  production: false,
  // Dev: usa el proxy de Angular (proxy.conf.local.json apunta a
  // http://localhost:56473). Path relativo = sin CORS, sin typo en
  // dominio de produccion.
  apiUrl: '/api/v1',
  // Vacia = captcha apagado en local. Pegar aqui la site key (o la
  // clave de prueba de Google) para probar contra un backend con
  // RECAPTCHA_ENABLED=true.
  recaptchaSiteKey: ''
};
