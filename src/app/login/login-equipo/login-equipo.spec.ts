import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginEquipo } from './login-equipo';

describe('LoginEquipo', () => {
  let component: LoginEquipo;
  let fixture: ComponentFixture<LoginEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginEquipo],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
