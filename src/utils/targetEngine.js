/**
 * Nutritional Target Calculation Engine (TDEE, BMR, BMI, Macro Targets)
 */

export const ACTIVITY_MODIFIERS = {
  sedentary: { label: 'Sedentary (Little or no exercise)', multiplier: 1.2 },
  light: { label: 'Lightly Active (1-3 days/wk)', multiplier: 1.375 },
  moderate: { label: 'Moderately Active (3-5 days/wk)', multiplier: 1.55 },
  heavy: { label: 'Very Active (6-7 days/wk)', multiplier: 1.725 },
};

export const GOAL_MODIFIERS = {
  lose: { label: 'Fat Loss (-300 kcal)', calorieOffset: -300, badge: 'Deficit' },
  maintain: { label: 'Maintenance (0 kcal)', calorieOffset: 0, badge: 'Maintenance' },
  gain: { label: 'Muscle Gain (+300 kcal)', calorieOffset: 300, badge: 'Surplus' },
};

/**
 * Calculates BMI from weight (kg) and height (cm)
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(1));
}

export function getBMICategory(bmi) {
  if (!bmi) return 'N/A';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Calculates BMR using the Mifflin-St Jeor Equation
 * Men: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
 * Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
 */
export function calculateBMR(weightKg, heightCm, age, gender = 'M') {
  if (!weightKg || !heightCm || !age) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender.toUpperCase() === 'F' ? Math.round(base - 161) : Math.round(base + 5);
}

/**
 * Calculates TDEE based on BMR and Activity Level
 */
export function calculateTDEE(bmr, activityLevel = 'moderate') {
  if (!bmr) return null;
  const modifier = ACTIVITY_MODIFIERS[activityLevel]?.multiplier || 1.55;
  return Math.round(bmr * modifier);
}

/**
 * Computes all profile metrics and dynamic daily targets
 */
export function calculateTargets(profile = {}, currentWeightKg = null) {
  const weight = Number(currentWeightKg || profile.baseline_weight_kg) || null;
  const height = Number(profile.height_cm) || null;
  const age = Number(profile.age) || null;
  const gender = profile.gender || 'M';
  const activityLevel = profile.activity_level || 'moderate';
  const goal = profile.goal || 'maintain';

  if (!weight || !height || !age) {
    return {
      hasCompleteProfile: false,
      bmi: null,
      bmiCategory: null,
      bmr: null,
      tdee: null,
      targetCalories: null,
      targetProtein: null,
      goalBadge: null,
    };
  }

  const bmi = calculateBMI(weight, height);
  const bmiCategory = getBMICategory(bmi);
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const goalOffset = GOAL_MODIFIERS[goal]?.calorieOffset ?? 0;
  const targetCalories = Math.max(1200, Math.round(tdee + goalOffset));
  const targetProtein = Math.round(weight * 2.2); // 2.2g per kg for muscle recovery

  return {
    hasCompleteProfile: true,
    weight,
    height,
    age,
    gender,
    activityLevel,
    goal,
    bmi,
    bmiCategory,
    bmr,
    tdee,
    targetCalories,
    targetProtein,
    goalBadge: GOAL_MODIFIERS[goal]?.badge || 'Maintenance',
  };
}
