import React, { memo } from 'react';
import { useSelector } from 'react-redux';

const DigitDisplay = memo(() => {
  const { currentDigit, phase } = useSelector(state => state.experiment.trialState);
  const { isCapturing } = useSelector(state => state.capture);
  const displayBlank = useSelector(state => state.experiment.displayBlank);

  console.log('Rendering digit display:', {
    currentDigit,
    phase,
    displayBlank,
    timestamp: Date.now()
  });

  return (
    <div className="digit-display">
      {!displayBlank ? (
        <>
          <div className="digit">{currentDigit}</div>
          <div className="instruction">Press 'f' for odd, 'j' for even</div>
          {phase === 'awaiting-response' && (
            <div className="response-indicator">Awaiting Response...</div>
          )}
        </>
      ) : (
        // Empty div when display is blank - maintains spacing but shows nothing
        <div></div>
      )}
    </div>
  );
});

DigitDisplay.displayName = 'DigitDisplay';

export default DigitDisplay;