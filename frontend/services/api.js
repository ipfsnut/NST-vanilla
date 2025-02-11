import { API_CONFIG } from '../config/api';

export const submitResponse = async (experimentId, response) => {
  const result = await fetch(`${API_CONFIG.BASE_URL}/response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      experimentId,
      responses: [response]
    })
  });
  return result.json();
};