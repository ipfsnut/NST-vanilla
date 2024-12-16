const formatJSON = (results) => {
  const formattedResults = {
    metadata: {
      experimentId: results.sessionMetrics.experimentId,
      startTime: results.sessionMetrics.startTime,
      endTime: results.sessionMetrics.lastActivity,
      totalTrials: results.sessionMetrics.totalTrials,
      completedTrials: results.sessionMetrics.trialsCompleted
    },
    performance: {
      accuracyRate: results.performanceMetrics.accuracyRate,
      averageResponseTime: results.performanceMetrics.averageResponseTime,
      completionRate: results.performanceMetrics.completionRate
    },
    trials: results.trialDetails.map(trial => ({
      trialNumber: trial.trialNumber,
      sequence: trial.sequence,
      effortLevel: trial.effortLevel,
      responses: trial.response,
      timing: trial.timing,
      captures: results.captureData.filter(c => c.trialNumber === trial.trialNumber)
    }))
  };

  return JSON.stringify(formattedResults, null, 2);
};

const formatCSV = (data) => {
  console.log('CSV data:', data);

  const headers = [
    'Trial Number',
    'Position',
    'Digit',
    'Response Key',
    'Correct',
    'Response Time',
    'Timestamp'
  ].join(',');

  const rows = data.trials.flatMap(trial => 
    trial.responses.map(response => [
      trial.trialNumber,
      response.position,
      response.digit,
      response.keyPressed,
      response.isCorrect ? 1 : 0,
      response.responseTime,
      response.timestamp
    ].join(','))
  );

  return [headers, ...rows].join('\n');
};

module.exports = {
  formatJSON,
  formatCSV
};
