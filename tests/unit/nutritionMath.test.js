import { describe, it, expect } from 'vitest';
import { calculateNutritionTargets } from '../../src/utils/nutritionMath';

describe('nutritionMath Utility', () => {
  it('falls back to 2500 kcal and 150g protein when profile is missing or incomplete', () => {
    const result = calculateNutritionTargets({});
    expect(result.hasProfile).toBe(false);
    expect(result.targetCalories).toBe(2500);
    expect(result.targetMacros.protein_g).toBe(150);
    expect(result.targetMacros.fat_g).toBe(Math.round((2500 * 0.25) / 9));
    expect(result.targetMacros.fiber_g).toBe(35);
  });

  it('calculates BMI, BMR, TDEE, and macro breakdown for a male on fat loss', () => {
    const profile = {
      height_cm: 180,
      age: 30,
      gender: 'M',
      activity_level: 'moderate', // 1.55
      goal: 'lose', // -300 kcal
      current_weight_kg: 80,
    };

    const result = calculateNutritionTargets(profile, 80);
    expect(result.hasProfile).toBe(true);

    // BMI: 80 / (1.8 ^ 2) = 24.7
    expect(result.bmi).toBe(24.7);

    // BMR: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(result.bmr).toBe(1780);

    // TDEE: 1780 * 1.55 = 2759
    expect(result.tdee).toBe(2759);

    // Target Calories: 2759 - 300 = 2459
    expect(result.targetCalories).toBe(2459);

    // Target Macros:
    // Protein: 80 * 2.2 = 176g (704 kcal)
    // Fat: 25% of 2459 = 614.75 kcal -> 614.75 / 9 = 68g
    // Carbs: (2459 - 704 - 68*9) / 4 = (2459 - 704 - 612) / 4 = 1143 / 4 = 286g
    // Fiber: (2459 / 1000) * 14 = 34g
    expect(result.targetMacros.protein_g).toBe(176);
    expect(result.targetMacros.fat_g).toBe(68);
    expect(result.targetMacros.carbs_g).toBe(286);
    expect(result.targetMacros.fiber_g).toBe(34);
  });

  it('calculates BMR and macro breakdown for a female on muscle gain', () => {
    const profile = {
      height_cm: 165,
      age: 26,
      gender: 'F',
      activity_level: 'light', // 1.375
      goal: 'gain', // +300 kcal
      current_weight_kg: 60,
    };

    const result = calculateNutritionTargets(profile, 60);
    expect(result.hasProfile).toBe(true);

    // BMR: 10*60 + 6.25*165 - 5*26 - 161 = 600 + 1031.25 - 130 - 161 = 1340
    expect(result.bmr).toBe(1340);

    // TDEE: 1340 * 1.375 = 1843
    expect(result.tdee).toBe(1843);

    // Target Calories: 1843 + 300 = 2143
    expect(result.targetCalories).toBe(2143);

    // Protein: 60 * 2.2 = 132g
    expect(result.targetMacros.protein_g).toBe(132);
    expect(result.targetMacros.fat_g).toBe(Math.round((2143 * 0.25) / 9));
  });
});
