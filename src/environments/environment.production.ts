export const environment = {
  production: true,
  // Produccion (staging en infra): pasa por Cloudflare -> lb-01 -> backend_public
  apiUrl: 'https://yacatec.devas-projects.sbs/api/v1',
  // Clave pública del sitio reCAPTCHA v3. Un solo par de llaves
  // cubre los dominios tecu/calipx/poch. Si queda vacía, el
  // interceptor no adjunta x-recaptcha-token.
  recaptchaSiteKey: '6LdaJZItAAAAAJ_5et0s_du2lb3Jp0cVRinrg0be'
};
