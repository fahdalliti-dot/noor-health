import { describe, it, expect } from 'vitest';
import { cn } from './utils';
import frMessages from '../messages/fr.json';
import arMessages from '../messages/ar.json';

describe('Web App (Slice 1)', () => {
  describe('CSS utility class merging (cn)', () => {
    it('merges class names and ignores falsy values', () => {
      expect(cn('btn', false && 'btn-active', 'btn-primary', null, undefined)).toBe('btn btn-primary');
    });
  });

  describe('i18n Messages (French & Arabic RTL)', () => {
    it('contains French translations with LTR direction', () => {
      expect(frMessages.direction).toBe('ltr');
      expect(frMessages.auth.login).toBeDefined();
      expect(frMessages.auth['2fa_setup']).toBeDefined();
      expect(frMessages.placeholder.email).toContain('cabinet.ma');
    });

    it('contains Arabic translations with RTL direction', () => {
      expect(arMessages.direction).toBe('rtl');
      expect(arMessages.auth.login).toBeDefined();
      expect(arMessages.auth['2fa_setup']).toBeDefined();
    });

    it('has matching key structure between fr and ar', () => {
      expect(Object.keys(frMessages.auth)).toEqual(Object.keys(arMessages.auth));
      expect(Object.keys(frMessages.placeholder)).toEqual(Object.keys(arMessages.placeholder));
    });
  });
});
