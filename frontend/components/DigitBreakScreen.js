import React from 'react';
import { useSelector } from 'react-redux';
import '../styles/breaks.css';

export const DigitBreakScreen = () => {
  const { breakState } = useSelector(state => state.experiment);
  
  return (
    <div className="break-screen digit-break">
      <div className="break-overlay" />
    </div>
  );
};