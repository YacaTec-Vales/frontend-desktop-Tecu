import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login, copyTextToClipboard } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('extractTotpSecret (private, via bracket access)', () => {
    // El metodo es privado; accedemos via cast a `any` para testear el
    // contrato sin acoplar el test a la implementacion.
    const extract = (url: string) =>
      (component as unknown as { extractTotpSecret: (u: string) => string })
        .extractTotpSecret(url);

    it('extrae secret de un otpauth://totp URL valido', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const url = `otpauth://totp/YacaTec:user-uuid?secret=${secret}&issuer=YacaTec&algorithm=SHA1&digits=6&period=30`;
      expect(extract(url)).toBe(secret);
    });

    it('extrae secret cuando esta URL-encoded en el query string', () => {
      const secret = 'JBSWY3DPEHPK3PXPABC';
      const url = `otpauth://totp/Yaca%20Tec:user%40yacatec.demo?secret=${secret}&issuer=YacaTec`;
      expect(extract(url)).toBe(secret);
    });

    it('devuelve string vacio cuando no hay query string', () => {
      expect(extract('otpauth://totp/YacaTec:user')).toBe('');
    });

    it('devuelve string vacio cuando no hay parametro secret', () => {
      expect(extract('otpauth://totp/YacaTec:user?issuer=YacaTec')).toBe('');
    });

    it('devuelve string vacio para entrada vacia', () => {
      expect(extract('')).toBe('');
    });

    it('toma el secret aunque haya otros params antes/despues', () => {
      const url =
        'otpauth://totp/YacaTec:user?algorithm=SHA1&secret=ABCDEFGH&digits=6&period=30';
      expect(extract(url)).toBe('ABCDEFGH');
    });

    it('maneja formato con espacios URL-encoded como + o %20', () => {
      const url =
        'otpauth://totp/Yaca%20Tec:user?secret=ABCD1234&issuer=Yaca+Tec';
      expect(extract(url)).toBe('ABCD1234');
    });
  });
});

describe('copyTextToClipboard', () => {
  // jsdom no expone navigator.clipboard por defecto; lo parchamos
  // globalmente al inicio del describe.
  const originalClipboard = Object.getOwnPropertyDescriptor(
    globalThis.navigator,
    'clipboard',
  );
  const originalSecureContext = Object.getOwnPropertyDescriptor(
    window,
    'isSecureContext',
  );
  const originalExecCommand = document.execCommand;

  afterEach(() => {
    // Restaurar estado entre tests.
    if (originalClipboard) {
      Object.defineProperty(globalThis.navigator, 'clipboard', originalClipboard);
    } else {
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
    if (originalSecureContext) {
      Object.defineProperty(window, 'isSecureContext', originalSecureContext);
    } else {
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        configurable: true,
        writable: true,
      });
    }
    document.execCommand = originalExecCommand;
  });

  function setSecureClipboard(writeText: ReturnType<typeof vi.fn>) {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
      writable: true,
    });
  }

  function setNoClipboard() {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
      writable: true,
    });
  }

  it('rechaza texto vacio o no-string', async () => {
    expect(await copyTextToClipboard('')).toBe(false);
    // @ts-expect-error: probando defensivo
    expect(await copyTextToClipboard(undefined)).toBe(false);
    // @ts-expect-error: probando defensivo
    expect(await copyTextToClipboard(null)).toBe(false);
  });

  it('usa Clipboard API cuando esta disponible y retorna true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setSecureClipboard(writeText);
    const result = await copyTextToClipboard('SECRET123');
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith('SECRET123');
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it('cae al fallback legacy si la Clipboard API rechaza', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
    setSecureClipboard(writeText);
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec as unknown as typeof document.execCommand;
    const result = await copyTextToClipboard('SECRET456');
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('retorna false si tanto la Clipboard API como el fallback fallan', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
    setSecureClipboard(writeText);
    const exec = vi.fn().mockReturnValue(false);
    document.execCommand = exec as unknown as typeof document.execCommand;
    const result = await copyTextToClipboard('SECRET789');
    expect(result).toBe(false);
  });

  it('cae al fallback legacy cuando no hay Clipboard API (no secure context)', async () => {
    setNoClipboard();
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec as unknown as typeof document.execCommand;
    const result = await copyTextToClipboard('SECRET000');
    expect(result).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });
});
