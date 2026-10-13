import '@testing-library/jest-dom/vitest';

// Provide window.scrollTo stub for jsdom
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.scrollIntoView = () => {};
}
