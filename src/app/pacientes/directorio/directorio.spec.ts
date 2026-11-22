import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Directorio } from './directorio';

describe('Directorio', () => {
  let component: Directorio;
  let fixture: ComponentFixture<Directorio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Directorio],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Directorio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
