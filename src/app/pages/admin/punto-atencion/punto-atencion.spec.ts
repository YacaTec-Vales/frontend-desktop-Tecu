import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuntoAtencion } from './punto-atencion';

describe('PuntoAtencion', () => {
  let component: PuntoAtencion;
  let fixture: ComponentFixture<PuntoAtencion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuntoAtencion],
    }).compileComponents();

    fixture = TestBed.createComponent(PuntoAtencion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
