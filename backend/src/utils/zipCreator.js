const JSZip = require('jszip');
const fs = require('fs').promises;

const createAndDownloadZip = async (experimentData) => {
  const zip = new JSZip();
  let csvContent = "Trial Number,Effort Level,Sequence,Response Count,Accuracy\n";

  experimentData.trials.forEach((trial, index) => {
    const trialResponses = experimentData.responses.filter(r => r.trial === index);
    const accuracy = trialResponses.filter(r => r.isCorrect).length / trialResponses.length;
    
    csvContent += `${index + 1},${trial.effortLevel},${trial.sequence.join('')},${trialResponses.length},${accuracy}\n`;
    
    // Add detailed response data for each trial
    const responsesCsv = "Digit,Response,Correct,Timestamp\n" + 
      trialResponses.map(r => `${r.digit},${r.response},${r.isCorrect},${r.timestamp}`).join('\n');
    zip.file(`trial_${index + 1}_responses.csv`, responsesCsv);
  });

  zip.file("summary.csv", csvContent);
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  });

  const fileName = `experiment_results_${Date.now()}.zip`;
  await fs.writeFile(fileName, zipBuffer);
  return fileName;
};

module.exports = { createAndDownloadZip };