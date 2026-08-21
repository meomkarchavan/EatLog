/**
 * Nutrition Math Calculation Engine
 * Mifflin-St Jeor BMR, TDEE, Dynamic Macro Targets (Protein, Fat, Carbs, Fiber), and BMI
 */

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
};

export const GOAL_ADJUSTMENTS = {
  lose: -300,
  maintain: 0,
  gain: 300,
};

/**
 * Calculates nutritional targets based on user profile and current weight.
 * Falls back to 2500 kcal & 150g protein if profile is missing/incomplete.
 */
export function calculateNutritionTargets(profile = {}, currentWeightKg = null) {
  const weight = Number(currentWeightKg || profile.current_weight_kg || profile.baseline_weight_kg) || null;
  const height = Number(profile.height_cm) || null;
  const age = Number(profile.age) || null;
  const gender = (profile.gender || 'M').toUpperCase();
  const activityLevel = (profile.activity_level || 'moderate').toLowerCase();
  const goal = (profile.goal || 'maintain').toLowerCase();

  // Fallback defaults if profile is incomplete
  if (!weight || !height || !age) {
    const fallbackCalories = 2500;
    const fallbackProtein = 150;
    const fallbackFat = Math.round((fallbackCalories * 0.25) / 9);
    const fallbackCarbs = Math.round((fallbackCalories - (fallbackProtein * 4 + fallbackFat * 9)) / 4);
    const fallbackFiber = Math.round((fallbackCalories / 1000) * 14);

    return {
      hasProfile: false,
      bmi: null,
      tdee: null,
      targetCalories: fallbackCalories,
      targetMacros: {
        protein_g: fallbackProtein,
        fat_g: fallbackFat,
        carbs_g: fallbackCarbs,
        fiber_g: fallbackFiber,
      },
    };
  }

  // 1. BMI: weight_kg / (height_m ^ 2)
  const heightM = height / 100;
  const bmi = Number((weight / (heightM * heightM)).toFixed(1));

  // 2. BMR: Mifflin-St Jeor Equation
  // Men: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
  // Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
  const baseBmr = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === 'F' ? Math.round(baseBmr - 161) : Math.round(baseBmr + 5);

  // 3. TDEE: BMR * Activity Multiplier
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  const tdee = Math.round(bmr * activityMultiplier);

  // 4. Target Calories: Adjusted by Goal (-300 lose, +0 maintain, +300 gain)
  const goalOffset = GOAL_ADJUSTMENTS[goal] ?? 0;
  const targetCalories = Math.max(1200, Math.round(tdee + goalOffset));

  // 5. Target Macros:
  // - Protein: 2.2g per kg of bodyweight
  // - Fat: 25% of total target calories (9 kcal/g)
  // - Carbs: Remaining calories (4 kcal/g)
  // - Fiber: 14g per 1000 calories
  const protein_g = Math.round(weight * 2.2);
  const fat_g = Math.round((targetCalories * 0.25) / 9);
  const remainingCaloriesForCarbs = targetCalories - (protein_g * 4 + fat_g * 9);
  const carbs_g = Math.max(0, Math.round(remainingCaloriesForCarbs / 4));
  const fiber_g = Math.round((targetCalories / 1000) * 14);

  return {
    hasProfile: true,
    bmi,
    bmr,
    tdee,
    targetCalories,
    targetMacros: {
      protein_g,
      fat_g,
      carbs_g,
      fiber_g,
    },
    goal,
  };
}
