import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ConsultaDetalle } from './consulta-detalle';

describe('ConsultaDetalle', () => {
  let component: ConsultaDetalle;
  let fixture: ComponentFixture<ConsultaDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaDetalle],
      // Ruta comodín: sin sesión de paciente el componente redirige a /login/paciente.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
