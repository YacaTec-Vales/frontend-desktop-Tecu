import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValesDigitales } from './vales-digitales';

describe('ValesDigitales', () => {
  let component: ValesDigitales;
  let fixture: ComponentFixture<ValesDigitales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValesDigitales],
    }).compileComponents();

    fixture = TestBed.createComponent(ValesDigitales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
