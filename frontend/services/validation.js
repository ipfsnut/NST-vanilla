const VALID_KEYS = {
  ODD: 'f',
  EVEN: 'j'
};

export const validateResponse = (response, digit) => {
  const isOdd = digit % 2 !== 0;
  const expectedKey = isOdd ? VALID_KEYS.ODD : VALID_KEYS.EVEN;
  
  return {
    isCorrect: response === expectedKey,
    responseType: isOdd ? 'odd' : 'even',
    expected: expectedKey,
    received: response
  };
};
