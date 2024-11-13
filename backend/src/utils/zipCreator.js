const JSZip = require('jszip');
const fs = require('fs').promises;

const createAndDownloadZip = async (allTrialData) => {
  const zip = new JSZip();
  let csvContent = "Trial Number,Effort Level,All Correct,Image Names,Responses\n";

  allTrialData.forEach((trial, trialIndex) => {
    const allCorrect = trial.responses.every(r => r.correct);
    const imageNames = [];

    trial.responses.forEach((response, responseIndex) => {
      if (response.imageBlob) {
        const imageName = `Trial_${trialIndex}_Response_${responseIndex}.jpg`;
        imageNames.push(imageName);
        zip.file(imageName, response.imageBlob);
      }
    });

    csvContent += `${trial.trialNumber},${trial.effortLevel},${allCorrect},${imageNames.join('|')},`;
    csvContent += trial.responses.map(r => `${r.digit}:${r.response}:${r.correct}`).join('|');
    csvContent += "\n";
  });

  zip.file("experiment_data.csv", csvContent);
  const zipBuffer = await zip.generateAsync({type: "nodebuffer"});
  
  const fileName = "experiment_results.zip";
  await fs.writeFile(fileName, zipBuffer);
  
  return fileName;
};

module.exports = { createAndDownloadZip };