export const environment = {
  production: true,
  // Produccion (staging en infra): pasa por Cloudflare -> lb-01 -> backend_public.
  // Subdominio dedicado en lb-01 (server block `api.taquizaschavez.com.mx` con
  // proxy_pass http://backend_public). El certificado wildcard de Cloudflare
  // Origin cubre taquizaschavez.com.mx y todos sus subdominios.
  apiUrl: 'https://api.taquizaschavez.com.mx/api/v1',
  // Clave pública del sitio reCAPTCHA v3. Un solo par de llaves
  // cubre los dominios tecu/calipx/poch. Si queda vacía, el
  // interceptor no adjunta x-recaptcha-token.
  recaptchaSiteKey: '6LdaJZItAAAAAJ_5et0s_du2lb3Jp0cVRinrg0be'
};
