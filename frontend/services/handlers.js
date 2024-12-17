import { validateResponse } from './validation';
import { API_CONFIG } from '../../config/api';

export const handleTrialResponse = async (response, state) => {
  const { experimentId, currentTrial, currentDigit, trials } = state;
  
  const validationResult = validateResponse(response, currentDigit);
  
  try {
    await fetch(`${API_CONFIG.BASE_URL}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        experimentId,
        response,
        digit: currentDigit,
        isCorrect: validationResult.isCorrect,
        timestamp: Date.now()
      })
    });

    return {
      nextDigit: trials[currentTrial]?.number[currentDigit + 1],
      isTrialComplete: currentDigit >= (trials[currentTrial]?.number.length - 1),
      isExperimentComplete: currentTrial >= trials.length - 1,
      validationResult
    };
  } catch (error) {
    console.error('Response handling failed:', error);
    throw error;
  }
};
