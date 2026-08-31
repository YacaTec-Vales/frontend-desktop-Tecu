export const environment = {
  production: true,
  // Produccion (staging en infra): pasa por Cloudflare -> lb-01 -> backend_public.
  // Subdominio dedicado en lb-01 (server block `api.taquizaschavez.com.mx` con
  // proxy_pass http://backend_public). El certificado wildcard de Cloudflare
  // Origin cubre taquizaschavez.com.mx y todos sus subdominios.
  //
  // FASE B (CORS proper fix): apiUrl es RELATIVO para que las requests
  // viajen como same-origin a traves del proxy de nginx en lb-01:vpn.conf
  // (location /api/ -> backend_vpn app-03:59763) o public.conf
  // (location /api/ -> backend_public). Esto elimina el preflight CORS
  // y simplifica la whitelist de CORS_ORIGINS en el backend.
  apiUrl: '/api/v1',
  // Clave pública del sitio reCAPTCHA v3. Un solo par de llaves
  // cubre los dominios tecu/calipx/poch. Si queda vacía, el
  // interceptor no adjunta x-recaptcha-token.
  recaptchaSiteKey: '6LdaJZItAAAAAJ_5et0s_du2lb3Jp0cVRinrg0be'
};
