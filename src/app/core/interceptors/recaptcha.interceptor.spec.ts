import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { RecaptchaService } from '../services/recaptcha.service';
import {
  recaptchaInterceptor,
  RECAPTCHA_TOKEN_HEADER,
} from './recaptcha.interceptor';

describe('recaptchaInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  const recaptchaMock = {
    isEnabled: true,
    getToken: vi.fn<() => Promise<string | null>>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    recaptchaMock.isEnabled = true;
    recaptchaMock.getToken.mockResolvedValue('fresh-token');

    TestBed.configureTestingModule({
      providers: [
        { provide: RecaptchaService, useValue: recaptchaMock },
        provideHttpClient(withInterceptors([recaptchaInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  /** El token llega vía promesa; esperar a que el interceptor lo adjunte. */
  async function expectOneWithRetry(url: string) {
    let matched: ReturnType<HttpTestingController['expectOne']> | undefined;
    await vi.waitFor(() => {
      matched = controller.expectOne(url);
    });
    return matched!;
  }

  it('adjunta el token a las peticiones POST', async () => {
    http.post('/api/v1/auth/login', {}).subscribe();

    const req = await expectOneWithRetry('/api/v1/auth/login');
    expect(req.request.headers.get(RECAPTCHA_TOKEN_HEADER)).toBe('fresh-token');
    req.flush({});
  });

  it.each(['PUT', 'PATCH', 'DELETE'])(
    'adjunta el token a las peticiones %s',
    async (method) => {
      http.request(method, '/api/v1/recurso').subscribe();

      const req = await expectOneWithRetry('/api/v1/recurso');
      expect(req.request.headers.get(RECAPTCHA_TOKEN_HEADER)).toBe(
        'fresh-token',
      );
      req.flush({});
    },
  );

  it('no toca las peticiones GET', async () => {
    http.get('/api/v1/catalogos').subscribe();

    const req = await expectOneWithRetry('/api/v1/catalogos');
    expect(req.request.headers.has(RECAPTCHA_TOKEN_HEADER)).toBe(false);
    req.flush([]);
    expect(recaptchaMock.getToken).not.toHaveBeenCalled();
  });

  it('no adjunta token cuando el captcha está desactivado', async () => {
    recaptchaMock.isEnabled = false;

    http.post('/api/v1/auth/login', {}).subscribe();

    const req = await expectOneWithRetry('/api/v1/auth/login');
    expect(req.request.headers.has(RECAPTCHA_TOKEN_HEADER)).toBe(false);
    req.flush({});
    expect(recaptchaMock.getToken).not.toHaveBeenCalled();
  });

  it('rechaza la peticion si Google falla (fail-closed)', async () => {
    recaptchaMock.getToken.mockRejectedValue(new Error('google down'));

    let receivedError: unknown;
    http.post('/api/v1/vales', {}).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    await vi.waitFor(() => {
      expect(receivedError).toBeDefined();
    });
    expect((receivedError as Error).message).toMatch(/No se pudo verificar reCAPTCHA/);

    // El request NUNCA debe salir: si llegara, controller.expectOne fallaría
    // (no fue llamado dentro del waitFor y la suscripcion ya errored).
    expect(() => controller.expectOne('/api/v1/vales')).toThrow();
  });
});
