/**
 * @fileoverview Helpers de validacion de formularios.
 *
 * Funciones puras (sin estado) para validar tipos de campos comunes
 * en formularios de la app. Cada funcion devuelve un string con el
 * mensaje de error (en espanol) si el valor NO cumple la regla, o
 * una cadena vacia ('') si esta bien. Esto permite usarlas directamente
 * como `[error]="validateName(nombre())"` en `app-input`.
 *
 * Las reglas reflejan las politicas del backend (ver
 * `backend-api/src/auth/services/password.service.ts` y los DTOs en
 * `backend-api/src/distribuidores/dto/` y `backend-api/src/clients/dto/`).
 *
 * Convenciones:
 *  - Todos los nombres de campo son cadenas vacias = no hay error.
 *  - Mensajes en espanol, tono profesional, sin exclamaciones.
 *  - Las funciones puras son testeables de forma aislada.
 *  - Este helper se replica identico en los 3 frontends (Tecu, Poch,
 *    Calipx) para mantener la misma logica de validacion en todas
 *    las apps. Cambios aqui deben replicarse en los otros repos.
 *
 * @module core/validators/form-validators
 * @author Equipo de desarrollo Tecu
 * @since 1.0.0
 */

/** Regex que matchea solo letras (incluye ASCII y Unicode para acentos, ñ, ü). */
const NAME_LETTERS_ONLY_REGEX =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ '\-][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;

/** Regex RFC persona fisica: 4 letras + 6 digitos + 3 alfanumericos (homoclave). */
const RFC_PERSONA_REGEX = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;

/** Regex RFC moral: 3 letras + 6 digitos + 3 alfanumericos. */
const RFC_MORAL_REGEX = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

/** Regex CURP oficial (4 letras + 6 digitos + 6 alfanum + 1 letra + 1 digito). */
const CURP_REGEX = /^[A-Z]{4}\d{6}[A-Z0-9]{6}[A-Z]\d{1}$/;

/** Regex email basico pero suficiente para evitar typos obvios. */
const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Regex telefono mexicano: 10 digitos continuos. */
const PHONE_REGEX = /^\d{10}$/;

/** Regex codigo postal mexicano: 5 digitos. */
const POSTAL_CODE_REGEX = /^\d{5}$/;

/** Regex CLABE interbancaria: 18 digitos. NO valida checksum (el banco al dispersar). */
const CLABE_REGEX = /^\d{18}$/;

/** Regex folio interno Mis Vales (ej. SOL-12345, DIG-00001). */
const FOLIO_GENERAL_REGEX = /^[A-Z]{2,5}-\d{4,8}$/;

/** Regex username (mismo que backend). */
const USERNAME_REGEX = /^[a-z0-9._-]+$/;

/** Regex folio prefix (3 letras mayusculas para codigo de sucursal). */
const FOLIO_PREFIX_REGEX = /^[A-Z]{3}$/;

/** Regex codigo MFA TOTP: 6 digitos. */
const MFA_CODE_REGEX = /^\d{6}$/;

/** Regex UUID v1-5 (cualquier version). */
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/** Regex CLABE interbancaria: 18 digitos. */
const CLABE_PATTERN_REGEX = /^\d{18}$/;

/**
 * Politica de contrasenas (debe coincidir con `backend-api/src/auth/services/password.service.ts`):
 *  - Minimo 8 caracteres.
 *  - Al menos una minuscula.
 *  - Al menos una mayuscula.
 *  - Al menos un digito.
 *  - NO requiere simbolo para usuarios finales (solo temporales).
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_POLICY = {
  lower: /[a-z]/,
  upper: /[A-Z]/,
  digit: /\d/,
};

/**
 * Verifica si un campo de texto NO esta vacio.
 * @param value - Valor a validar.
 * @param fieldName - Nombre del campo para el mensaje (ej. "nombre").
 * @returns '' si OK, mensaje si vacio.
 */
export function required(value: string | null | undefined, fieldName: string): string {
  if (value == null || String(value).trim().length === 0) {
    return `El campo ${fieldName} es obligatorio.`;
  }
  return '';
}

/**
 * Verifica que el texto sea un nombre valido:
 *  - Solo letras (incluye acentos, ñ, ü).
 *  - Puede contener espacios, apostrofes y guiones entre palabras.
 *  - Sin numeros ni simbolos.
 *  - Longitud entre 2 y 100 caracteres.
 * @param value - Valor a validar.
 * @param fieldName - Nombre del campo (ej. "nombre").
 */
export function validateName(value: string | null | undefined, fieldName = 'nombre'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (v.length < 2) return `El ${fieldName} debe tener al menos 2 caracteres.`;
  if (v.length > 100) return `El ${fieldName} no puede tener mas de 100 caracteres.`;
  if (!NAME_LETTERS_ONLY_REGEX.test(v)) {
    return `El ${fieldName} solo puede contener letras, espacios, apostrofes y guiones. No se permiten numeros ni simbolos.`;
  }
  return '';
}

/**
 * Verifica email con formato valido.
 * @param value - Valor a validar.
 * @param fieldName - Nombre del campo (default "correo electronico").
 */
export function validateEmail(value: string | null | undefined, fieldName = 'correo electronico'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (v.length > 254) return `El ${fieldName} es demasiado largo.`;
  if (!EMAIL_REGEX.test(v)) {
    return `Ingresa un ${fieldName} valido (ejemplo: usuario@dominio.com).`;
  }
  return '';
}

/**
 * Verifica que sea un telefono de 10 digitos (formato mexicano).
 */
export function validatePhone(value: string | null | undefined, fieldName = 'telefono'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (!PHONE_REGEX.test(v)) {
    return `El ${fieldName} debe tener exactamente 10 digitos sin espacios ni guiones.`;
  }
  return '';
}

/**
 * Verifica codigo postal mexicano (5 digitos).
 */
export function validatePostalCode(value: string | null | undefined, fieldName = 'codigo postal'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (!POSTAL_CODE_REGEX.test(v)) {
    return `El ${fieldName} debe tener exactamente 5 digitos.`;
  }
  return '';
}

/**
 * Verifica una CURP con regex oficial.
 */
export function validateCurp(value: string | null | undefined, fieldName = 'CURP'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim().toUpperCase();
  if (v.length !== 18) {
    return `La ${fieldName} debe tener exactamente 18 caracteres.`;
  }
  if (!CURP_REGEX.test(v)) {
    return `La ${fieldName} no tiene un formato valido. Verifica las letras y digitos.`;
  }
  return '';
}

/**
 * Verifica un RFC (persona fisica o moral). Acepta ambos formatos.
 */
export function validateRfc(value: string | null | undefined, fieldName = 'RFC'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim().toUpperCase();
  if (v.length < 12 || v.length > 13) {
    return `El ${fieldName} debe tener 12 caracteres (moral) o 13 caracteres (persona fisica).`;
  }
  if (!RFC_PERSONA_REGEX.test(v) && !RFC_MORAL_REGEX.test(v)) {
    return `El ${fieldName} no tiene un formato valido. Ejemplo persona fisica: LOHC900101AAA.`;
  }
  return '';
}

/**
 * Verifica una CLABE interbancaria: 18 digitos. NO valida checksum
 * (eso lo hace el banco al dispersar).
 */
export function validateClabe(value: string | null | undefined, fieldName = 'CLABE'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (!CLABE_PATTERN_REGEX.test(v)) {
    return `La ${fieldName} debe tener exactamente 18 digitos sin espacios.`;
  }
  return '';
}

/**
 * Verifica codigo de sucursal (folio prefix) de 3 letras mayusculas.
 */
export function validateFolioPrefix(value: string | null | undefined): string {
  const empty = required(value, 'codigo de sucursal');
  if (empty) return empty;
  const v = String(value).trim().toUpperCase();
  if (!FOLIO_PREFIX_REGEX.test(v)) {
    return `El codigo de sucursal debe tener exactamente 3 letras mayusculas (ej. GDL, CDMX).`;
  }
  return '';
}

/**
 * Verifica un nombre de usuario: 3-50 caracteres, lowercase, numeros,
 * guion bajo, guion medio y punto. Valida SIN convertir a minusculas
 * para detectar cuando el usuario escribe mayusculas por error.
 */
export function validateUsername(value: string | null | undefined): string {
  const empty = required(value, 'nombre de usuario');
  if (empty) return empty;
  const v = String(value).trim();
  if (v.length < 3) return `El nombre de usuario debe tener al menos 3 caracteres.`;
  if (v.length > 50) return `El nombre de usuario no puede tener mas de 50 caracteres.`;
  if (v !== v.toLowerCase()) {
    return `El nombre de usuario solo puede tener letras minusculas, numeros, guion, guion bajo y punto.`;
  }
  if (!USERNAME_REGEX.test(v)) {
    return `El nombre de usuario solo puede tener letras minusculas, numeros, guion, guion bajo y punto.`;
  }
  return '';
}

/**
 * Verifica que la contrasena cumpla la politica de Mis Vales
 * (igual a `PasswordService.validateStrength` del backend):
 *  - Minimo 8 caracteres.
 *  - Al menos una minuscula.
 *  - Al menos una mayuscula.
 *  - Al menos un digito.
 *
 * NOTA: el backend NO exige simbolo para usuarios finales. Las
 * contrasenas temporales administrativas SI lo exigen pero el
 * usuario nunca las escribe, asi que no se valida aqui.
 *
 * @returns '' si OK, mensaje (primer motivo) si falla, o lista de
 *   motivos si se pasa `returnAll`.
 */
export function validatePassword(
  value: string | null | undefined,
  returnAll = false,
): string {
  if (value == null) return 'La contrasena es obligatoria.';
  const reasons: string[] = [];
  if (value.length < PASSWORD_MIN_LENGTH) {
    reasons.push(`minimo ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!PASSWORD_POLICY.lower.test(value)) reasons.push('al menos una minuscula');
  if (!PASSWORD_POLICY.upper.test(value)) reasons.push('al menos una mayuscula');
  if (!PASSWORD_POLICY.digit.test(value)) reasons.push('al menos un digito');
  if (reasons.length === 0) return '';
  if (returnAll) {
    return `La contrasena no cumple: ${reasons.join(', ')}.`;
  }
  // Devuelve el primer motivo para UI por campo
  return `La contrasena debe tener ${reasons[0]}.`;
}

/**
 * Verifica que dos contrasenas coincidan.
 */
export function validatePasswordsMatch(password: string, confirm: string): string {
  if (password.length === 0) return '';
  if (password !== confirm) return 'Las contrasenas no coinciden.';
  return '';
}

/**
 * Verifica codigo MFA: 6 digitos exactos.
 */
export function validateMfaCode(value: string | null | undefined): string {
  const empty = required(value, 'codigo MFA');
  if (empty) return empty;
  const v = String(value).trim();
  if (!MFA_CODE_REGEX.test(v)) {
    return `El codigo MFA debe tener exactamente 6 digitos.`;
  }
  return '';
}

/**
 * Verifica folio interno (formato XXX-NNNN). Valida SIN convertir
 * a mayusculas para detectar errores del usuario al teclear.
 */
export function validateFolio(value: string | null | undefined): string {
  const empty = required(value, 'folio');
  if (empty) return empty;
  const v = String(value).trim();
  if (!FOLIO_GENERAL_REGEX.test(v)) {
    return `El folio debe tener el formato XXX-1234 (2-5 letras MAYUSCULAS, guion, 4-8 digitos).`;
  }
  return '';
}

/**
 * Verifica UUID v1-5.
 */
export function validateUuid(value: string | null | undefined, fieldName = 'identificador'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (!UUID_REGEX.test(v)) {
    return `El ${fieldName} no tiene un formato UUID valido.`;
  }
  return '';
}

/**
 * Verifica que el campo sea un campo de texto "razon" o comentario:
 *  - Requerido.
 *  - Minimo 10 caracteres (auditoria minima).
 *  - Maximo 500 caracteres.
 */
export function validateReason(value: string | null | undefined, minLen = 10, maxLen = 500, fieldName = 'motivo'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (v.length < minLen) return `El ${fieldName} debe tener al menos ${minLen} caracteres.`;
  if (v.length > maxLen) return `El ${fieldName} no puede tener mas de ${maxLen} caracteres.`;
  return '';
}

/**
 * Verifica que sea un monto (numero) positivo. Acepta string o numero.
 * @returns '' si OK, mensaje si falla.
 */
export function validatePositiveAmount(value: string | number | null | undefined, fieldName = 'monto', max = 1_000_000_000): string {
  if (value == null || String(value).trim().length === 0) {
    return `El ${fieldName} es obligatorio.`;
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return `El ${fieldName} debe ser un numero valido.`;
  if (n <= 0) return `El ${fieldName} debe ser mayor a cero.`;
  if (n > max) return `El ${fieldName} no puede ser mayor a ${max.toLocaleString('es-MX')}.`;
  return '';
}

/**
 * Verifica fecha de nacimiento:
 *  - Requerida y en formato ISO YYYY-MM-DD.
 *  - No puede ser futura.
 *  - Edad minima `minAge` (default 18).
 *  - Edad maxima `maxAge` (default 120).
 */
export function validateBirthDate(
  value: string | null | undefined,
  minAge = 18,
  maxAge = 120,
): string {
  const empty = required(value, 'fecha de nacimiento');
  if (empty) return empty;
  const v = String(value).trim();
  // Acepta YYYY-MM-DD o ISO completo
  const dateOnly = v.length >= 10 ? v.substring(0, 10) : v;
  const date = new Date(dateOnly + 'T00:00:00');
  if (Number.isNaN(date.getTime())) {
    return `La fecha de nacimiento no tiene un formato valido (YYYY-MM-DD).`;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() > today.getTime()) {
    return `La fecha de nacimiento no puede ser futura.`;
  }
  const ageMs = today.getTime() - date.getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < minAge) {
    return `La persona debe tener al menos ${minAge} anos cumplidos.`;
  }
  if (ageYears > maxAge) {
    return `La fecha de nacimiento no es razonable (edad mayor a ${maxAge} anos).`;
  }
  return '';
}

/**
 * Verifica una fecha de corte/pago:
 *  - Requerida.
 *  - No puede ser futura.
 *  - Si `onlyDayOfMonth` esta definido, valida que sea 1-31.
 */
export function validateCutDate(
  value: string | null | undefined,
  fieldName = 'fecha de corte',
  allowFuture = false,
): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const date = new Date(String(value).trim() + 'T00:00:00');
  if (Number.isNaN(date.getTime())) {
    return `La ${fieldName} no tiene un formato valido (YYYY-MM-DD).`;
  }
  if (!allowFuture) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date.getTime() > today.getTime()) {
      return `La ${fieldName} no puede ser futura.`;
    }
  }
  return '';
}

/**
 * Verifica que dos fechas tengan un rango valido:
 *  - fechaFin debe ser >= fechaInicio.
 */
export function validateDateRange(start: string, end: string, startName = 'fecha de inicio', endName = 'fecha de fin'): string {
  if (!start || !end) return '';
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
  if (e.getTime() < s.getTime()) {
    return `La ${endName} no puede ser anterior a la ${startName}.`;
  }
  return '';
}

/**
 * Verifica que el campo sea "banco" (string libre de 2-80 chars).
 * Backend acepta cualquier nombre; nosotros pedimos al menos 2 chars
 * para evitar typos.
 */
export function validateBankName(value: string | null | undefined, fieldName = 'banco'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (v.length < 2) return `El nombre del ${fieldName} debe tener al menos 2 caracteres.`;
  if (v.length > 80) return `El nombre del ${fieldName} es demasiado largo (max 80).`;
  return '';
}

/**
 * Verifica una descripcion (mas laxa que un motivo, pero coherente):
 *  - Requerida.
 *  - Minimo 5 caracteres.
 *  - Maximo 500 caracteres.
 */
export function validateDescription(value: string | null | undefined, minLen = 5, maxLen = 500, fieldName = 'descripcion'): string {
  const empty = required(value, fieldName);
  if (empty) return empty;
  const v = String(value).trim();
  if (v.length < minLen) return `La ${fieldName} debe tener al menos ${minLen} caracteres.`;
  if (v.length > maxLen) return `La ${fieldName} no puede tener mas de ${maxLen} caracteres.`;
  return '';
}

// Re-exports para tests si se necesitan las regex
export const PATTERNS = {
  NAME: NAME_LETTERS_ONLY_REGEX,
  EMAIL: EMAIL_REGEX,
  PHONE: PHONE_REGEX,
  POSTAL_CODE: POSTAL_CODE_REGEX,
  CURP: CURP_REGEX,
  RFC_PERSONA: RFC_PERSONA_REGEX,
  RFC_MORAL: RFC_MORAL_REGEX,
  CLABE: CLABE_REGEX,
  FOLIO_PREFIX: FOLIO_PREFIX_REGEX,
  USERNAME: USERNAME_REGEX,
  FOLIO_GENERAL: FOLIO_GENERAL_REGEX,
  MFA_CODE: MFA_CODE_REGEX,
  UUID: UUID_REGEX,
} as const;
