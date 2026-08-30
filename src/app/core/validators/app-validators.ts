import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validadores reusables del admin y de futuros formularios.
 *
 * Replican las reglas del backend NestJS (class-validator) para
 * dar feedback inmediato sin esperar el 400:
 *
 *  - `personName`: 2-100 chars, letras Unicode (incluye acentos y
 *    espacios), guion, apostrofe. SIN digitos. Usado para
 *    firstName / lastNamePaternal / lastNameMaternal.
 *  - `branchName`: 3-100 chars, cualquier printable excepto `<>`.
 *    SI permite digitos (`Sucursal 2`, `Matriz 3`). Replica
 *    `CreateBranchDto.name` y `CreateUserDto.firstName` (sin el
 *    "sin digitos" de personas).
 *  - `phoneMx`: exactamente 10 digitos. Coincide con
 *    `Validators.pattern('^[0-9]{10}$')` que ya usan catalogos
 *    y plantilla, pero centralizado.
 *  - `folioPrefix`: 3 letras A-Z (case-insensitive, el backend
 *    normaliza con `folioPrefixToUpper`).
 *  - `usernameSlug`: solo `a-z0-9._-` (el backend hace
 *    `trimLower` antes de validar el regex).
 *  - `emailMax255`: cap de longitud ademas de `email`.
 *  - `paymentDayAfterCutoff(5)`: el backend exige que el dia de
 *    pago este al menos N dias despues del corte (envuelve entre
 *    meses). Sin este validador, un 15/20 pasa pero 15/18 da 400.
 */
export class AppValidators {
  static personName(): ValidatorFn {
    const re = /^[\p{L}][\p{L}\s'\-.]{1,99}$/u;
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString().trim();
      if (!v) return null;
      return re.test(v) ? null : { personName: true };
    };
  }

  static branchName(): ValidatorFn {
    const re = /^[^<>]{3,100}$/;
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString().trim();
      if (!v) return null;
      return re.test(v) ? null : { branchName: true };
    };
  }

  static phoneMx(): ValidatorFn {
    const re = /^[0-9]{10}$/;
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString().trim();
      if (!v) return null;
      return re.test(v) ? null : { phoneMx: true };
    };
  }

  static folioPrefix(): ValidatorFn {
    const re = /^[A-Za-z]{3}$/;
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString().trim();
      if (!v) return null;
      return re.test(v) ? null : { folioPrefix: true };
    };
  }

  static usernameSlug(): ValidatorFn {
    const re = /^[a-z0-9._-]+$/;
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString();
      if (!v) return null;
      return re.test(v) ? null : { usernameSlug: true };
    };
  }

  static emailMax255(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString();
      return v.length <= 255 ? null : { emailMaxLength: { requiredLength: 255 } };
    };
  }

  /**
   * Cross-field validator para el corte/pago de sucursales.
   * Toma el grupo de FormControls y devuelve error si
   * `paymentDay - cutoffDay` (con wrap de 31) < `minDays`.
   * Replica `IsAtLeastFiveDaysAfterCutoff` del backend
   * (branch.dto / branch-cutoff-response.dto).
   */
  static paymentDayAfterCutoff(minDays = 5): ValidatorFn {
    return (g: AbstractControl): ValidationErrors | null => {
      const cutoff = Number(g.get('cutoffDay')?.value);
      const payment = Number(g.get('paymentDay')?.value);
      if (!Number.isFinite(cutoff) || !Number.isFinite(payment)) return null;
      if (cutoff < 1 || cutoff > 31 || payment < 1 || payment > 31) return null;
      let diff = (payment - cutoff + 31) % 31;
      if (diff === 0) diff = 31;
      return diff >= minDays
        ? null
        : { paymentDayAfterCutoff: { minDays, actual: diff } };
    };
  }
}
