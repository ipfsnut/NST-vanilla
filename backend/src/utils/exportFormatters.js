class ExportFormatter {
  formatJSON(results) {
    return JSON.stringify(results, null, 2);
  }

  formatCSV(results) {
    const headers = [
      'trialNumber',
      'sequence',
      'effortLevel',
      'responseTime',
      'isCorrect',
      'captureTimestamp'
    ];

    const rows = results.trialDetails.map(trial => {
      const capture = results.captureData.find(c => c.trialNumber === trial.trialNumber);
      return [
        trial.trialNumber,
        trial.sequence,
        trial.effortLevel,
        trial.timing,
        trial.response?.isCorrect || false,
        capture?.timestamp || ''
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

module.exports = new ExportFormatter();
