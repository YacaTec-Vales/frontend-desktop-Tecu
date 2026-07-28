import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Conciliacion } from './conciliacion';

describe('Conciliacion', () => {
  let component: Conciliacion;
  let fixture: ComponentFixture<Conciliacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Conciliacion],
    }).compileComponents();

    fixture = TestBed.createComponent(Conciliacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
