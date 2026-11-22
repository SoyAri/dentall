import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Expediente } from './expediente';

describe('Expediente', () => {
  let component: Expediente;
  let fixture: ComponentFixture<Expediente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Expediente],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Expediente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
