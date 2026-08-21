import { environment } from '../../../environments/environment';
import {
  DEFAULT_RECAPTCHA_ACTION,
  RecaptchaService,
} from './recaptcha.service';

describe('RecaptchaService', () => {
  const originalSiteKey = environment.recaptchaSiteKey;

  const fakeGrecaptcha = {
    ready: (cb: () => void) => cb(),
    execute: vi.fn().mockResolvedValue('token-abc'),
  };

  function mockScriptInjection(onload = true) {
    const originalCreateElement = document.createElement.bind(document);
    return vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'script') {
          queueMicrotask(() => {
            if (onload) {
              window.grecaptcha = fakeGrecaptcha;
              if (typeof el.onload === 'function') el.onload(new Event('load'));
            } else if (typeof el.onerror === 'function') {
              el.onerror(new Event('error'));
            }
          });
        }
        return el;
      });
  }

  afterEach(() => {
    environment.recaptchaSiteKey = originalSiteKey;
    delete window.grecaptcha;
    document.head.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('está desactivado cuando la site key está vacía', () => {
    environment.recaptchaSiteKey = '';

    expect(new RecaptchaService().isEnabled).toBe(false);
  });

  it('getToken retorna null sin tocar el DOM cuando está desactivado', async () => {
    environment.recaptchaSiteKey = '';
    const createElementSpy = vi.spyOn(document, 'createElement');

    await expect(new RecaptchaService().getToken()).resolves.toBeNull();
    expect(createElementSpy).not.toHaveBeenCalled();
  });

  it('está activo cuando hay site key', () => {
    environment.recaptchaSiteKey = 'site-key-test';

    expect(new RecaptchaService().isEnabled).toBe(true);
  });

  it('inyecta el script una vez y resuelve el token de grecaptcha', async () => {
    environment.recaptchaSiteKey = 'site-key-test';
    const createElementSpy = mockScriptInjection();

    await expect(
      new RecaptchaService().getToken('login'),
    ).resolves.toBe('token-abc');
    expect(fakeGrecaptcha.execute).toHaveBeenCalledWith('site-key-test', {
      action: 'login',
    });
    expect(createElementSpy).toHaveBeenCalledWith('script');
  });

  it('usa la acción por defecto submit cuando no se especifica', async () => {
    environment.recaptchaSiteKey = 'site-key-test';
    mockScriptInjection();

    await new RecaptchaService().getToken();
    expect(fakeGrecaptcha.execute).toHaveBeenCalledWith('site-key-test', {
      action: DEFAULT_RECAPTCHA_ACTION,
    });
  });

  it('no re-inyecta el script si grecaptcha ya está presente', async () => {
    environment.recaptchaSiteKey = 'site-key-test';
    window.grecaptcha = fakeGrecaptcha;
    const createElementSpy = vi.spyOn(document, 'createElement');

    await new RecaptchaService().getToken();
    expect(createElementSpy).not.toHaveBeenCalledWith('script');
  });

  it('rechaza si el script de Google falla al cargar', async () => {
    environment.recaptchaSiteKey = 'site-key-test';
    mockScriptInjection(false);

    await expect(new RecaptchaService().getToken()).rejects.toThrow(
      /no se pudo cargar el script/,
    );
  });
});
