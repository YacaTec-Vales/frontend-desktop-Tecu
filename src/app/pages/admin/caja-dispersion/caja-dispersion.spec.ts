import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CajaDispersion } from './caja-dispersion';

describe('CajaDispersion', () => {
  let component: CajaDispersion;
  let fixture: ComponentFixture<CajaDispersion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CajaDispersion],
    }).compileComponents();

    fixture = TestBed.createComponent(CajaDispersion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
