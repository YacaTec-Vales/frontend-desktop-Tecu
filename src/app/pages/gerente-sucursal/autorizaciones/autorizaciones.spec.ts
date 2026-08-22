import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Autorizaciones } from './autorizaciones';

describe('Autorizaciones', () => {
  let component: Autorizaciones;
  let fixture: ComponentFixture<Autorizaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Autorizaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Autorizaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
