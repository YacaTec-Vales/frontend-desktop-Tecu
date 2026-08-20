/**
 * Utilidad para sanitizar datos antes de enviarlos al backend.
 * Recorre objetos y arreglos recursivamente para:
 * 1. Hacer trim() de los strings (quitar espacios al inicio y final).
 * 2. Eliminar etiquetas HTML básicas para evitar inyecciones XSS (aunque Angular lo maneja en el DOM, 
 *    el backend lo agradece).
 */
export function sanitizePayload<T>(payload: T): T {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload === 'string') {
    // Trim spaces and remove basic HTML tags
    return payload.trim().replace(/<[^>]*>?/gm, '') as unknown as T;
  }

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item)) as unknown as T;
  }

  if (typeof payload === 'object' && !(payload instanceof Date)) {
    const sanitizedObj: any = {};
    for (const [key, value] of Object.entries(payload)) {
      sanitizedObj[key] = sanitizePayload(value);
    }
    return sanitizedObj as T;
  }

  // Devolver números, booleanos, fechas, etc., tal cual
  return payload;
}
