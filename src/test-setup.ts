// Configuración global de las pruebas unitarias (Vitest + jsdom).
// jsdom no implementa window.matchMedia, que usa ThemeService para detectar
// el modo oscuro del sistema; se define un stub que siempre responde "light".
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}
