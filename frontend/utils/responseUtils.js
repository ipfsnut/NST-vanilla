export const validateKeyPress = (key, phase) => {
  return (key === 'f' || key === 'j') && phase === 'running';
};

export const createResponsePayload = ({ experimentId, key, digit, digitIndex, trialNumber }) => {
  const isOdd = digit % 2 === 1;
  return {
    experimentId,
    response: key,
    responseType: key === 'f' ? 'odd' : 'even',
    digit,
    isCorrect: (key === 'f' && isOdd) || (key === 'j' && !isOdd),
    timestamp: Date.now(),
    position: digitIndex,
    trialNumber
  };
};
