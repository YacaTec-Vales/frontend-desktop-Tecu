import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Distribuidoras } from './distribuidoras';

describe('Distribuidoras', () => {
  let component: Distribuidoras;
  let fixture: ComponentFixture<Distribuidoras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Distribuidoras],
    }).compileComponents();

    fixture = TestBed.createComponent(Distribuidoras);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
