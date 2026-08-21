export const environment = {
  production: true,
  // Produccion (staging en infra): pasa por Cloudflare -> lb-01 -> backend_public
  apiUrl: 'https://api.taquizaschavez.com.mx/api/v1',
  // Clave pública del sitio reCAPTCHA v3. Un solo par de llaves
  // cubre los dominios tecu/calipx/poch. Si queda vacía, el
  // interceptor no adjunta x-recaptcha-token.
  recaptchaSiteKey: '6LfrdwktAAAAADqngll9t39PaELG52BcoHv8gw8v'
};
