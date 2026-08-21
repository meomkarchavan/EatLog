import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateTargets,
} from '../../src/utils/targetEngine';

describe('Target Engine Utility', () => {
  it('calculates BMI and categorizes correctly', () => {
    // 75kg at 178cm -> 75 / (1.78 * 1.78) = 23.67 -> 23.7
    const bmi = calculateBMI(75, 178);
    expect(bmi).toBe(23.7);
    expect(getBMICategory(bmi)).toBe('Normal weight');

    // 95kg at 175cm -> 31.0 -> Obese
    const obeseBmi = calculateBMI(95, 175);
    expect(obeseBmi).toBe(31);
    expect(getBMICategory(obeseBmi)).toBe('Obese');
  });

  it('calculates BMR using Mifflin-St Jeor equation for men and women', () => {
    // 80kg, 180cm, 30y, Male: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const bmrMale = calculateBMR(80, 180, 30, 'M');
    expect(bmrMale).toBe(1780);

    // 60kg, 165cm, 28y, Female: 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330
    const bmrFemale = calculateBMR(60, 165, 28, 'F');
    expect(bmrFemale).toBe(1330);
  });

  it('calculates TDEE using activity modifiers', () => {
    // BMR 1780 with moderate activity (1.55) = 2759
    const tdee = calculateTDEE(1780, 'moderate');
    expect(tdee).toBe(2759);
  });

  it('calculates dynamic daily calorie and protein targets based on goal', () => {
    const profile = {
      height_cm: 180,
      age: 30,
      gender: 'M',
      activity_level: 'moderate',
      goal: 'lose',
      baseline_weight_kg: 80,
    };

    const targets = calculateTargets(profile, 80);
    expect(targets.hasCompleteProfile).toBe(true);
    expect(targets.bmr).toBe(1780);
    expect(targets.tdee).toBe(2759);
    // Lose goal: TDEE - 300 = 2459
    expect(targets.targetCalories).toBe(2459);
    // Protein: 80 * 2.2 = 176g
    expect(targets.targetProtein).toBe(176);
    expect(targets.goalBadge).toBe('Deficit');
  });
});
