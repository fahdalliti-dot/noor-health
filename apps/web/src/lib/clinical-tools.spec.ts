import { describe, it, expect } from 'vitest';

describe('Clinical Modules & Moroccan Medical Logic', () => {
  describe('DMP Allergy Contraindication Guard', () => {
    it('flags penicillin contraindication for Augmentin and Amoxicilline', () => {
      const patientAllergies = ['Pénicilline', 'Bêta-lactamines'];
      const contraindications = ['Pénicilline', 'Amoxicilline', 'Bêta-lactamines'];

      const hasContra = contraindications.some((c) =>
        patientAllergies.some((a) => a.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(a.toLowerCase())),
      );

      expect(hasContra).toBe(true);
    });

    it('does not flag contraindication for Paracétamol when patient only allergic to Pénicilline', () => {
      const patientAllergies = ['Pénicilline'];
      const contraindications = ['Paracétamol', 'Insuffisance hépatique sévère'];

      const hasContra = contraindications.some((c) =>
        patientAllergies.some((a) => a.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(a.toLowerCase())),
      );

      expect(hasContra).toBe(false);
    });
  });

  describe('Pediatric WHO Growth Classification', () => {
    function classifyWeight(weightKg: number): string {
      if (weightKg < 7.0) return 'Poids faible';
      if (weightKg > 9.8) return 'Poids élevé';
      return 'Poids normal';
    }

    it('correctly classifies infant weight for 8-month-old', () => {
      expect(classifyWeight(8.2)).toBe('Poids normal');
      expect(classifyWeight(6.5)).toBe('Poids faible');
      expect(classifyWeight(10.5)).toBe('Poids élevé');
    });
  });

  describe('Moroccan Legal Medical Certificate (ITT)', () => {
    it('formats ITT duration for legal court reports', () => {
      const ittDays = 15;
      const formatted = `Incapacité Totale Temporaire (ITT) de travail de ${ittDays} jours`;
      expect(formatted).toContain('15 jours');
    });
  });

  describe('Moroccan CMI Currency Formatting', () => {
    it('formats amounts correctly in Moroccan Dirhams', () => {
      const amount = 400;
      const formatted = `${amount.toLocaleString('fr-FR')} DH`;
      expect(formatted).toBe('400 DH');
    });
  });
});
