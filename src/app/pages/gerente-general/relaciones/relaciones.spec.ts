import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Relaciones } from './relaciones';

describe('Relaciones', () => {
  let component: Relaciones;
  let fixture: ComponentFixture<Relaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Relaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Relaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
