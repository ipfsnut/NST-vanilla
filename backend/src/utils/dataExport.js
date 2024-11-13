const fs = require('fs');
const csv = require('csv-writer').createObjectCsvWriter;
const archiver = require('archiver');

// Function to generate CSV
const generateCSV = async (data, filename) => {
  const csvWriter = csv({
    path: filename,
    header: Object.keys(data[0]).map(key => ({id: key, title: key}))
  });
  
  await csvWriter.writeRecords(data);
  return filename;
};

// Function to create ZIP
const createZip = (files, outputPath) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);

    archive.pipe(output);
    files.forEach(file => archive.file(file, { name: file.split('/').pop() }));
    archive.finalize();
  });
};

module.exports = { generateCSV, createZip };
