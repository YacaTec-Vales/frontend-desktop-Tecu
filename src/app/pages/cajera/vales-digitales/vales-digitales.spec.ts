import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValesDigitalesComponent } from './vales-digitales';

describe('ValesDigitales', () => {
  let component: ValesDigitalesComponent;
  let fixture: ComponentFixture<ValesDigitalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValesDigitalesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ValesDigitalesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
