import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaArchivos } from './carga-archivos';

describe('CargaArchivos', () => {
  let component: CargaArchivos;
  let fixture: ComponentFixture<CargaArchivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaArchivos],
    }).compileComponents();

    fixture = TestBed.createComponent(CargaArchivos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
