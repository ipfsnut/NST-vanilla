const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const exportFormatters = require('./exportFormatters');

const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
const createAndDownloadZip = async (data) => {
  const zipPath = path.join(tempDir, `${data.metadata.sessionId}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 }});
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Archive created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve(zipPath);
    });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      reject(err);
    });
    
    archive.pipe(output);

    // Add formatted CSV data
    const formattedData = {
      trials: data.experimentData.trials || []
    };
    const csvData = exportFormatters.formatCSV(formattedData);
    archive.append(Buffer.from(csvData), { name: 'response-data.csv' });

    // Add metadata
    const metadataBuffer = Buffer.from(JSON.stringify(data.metadata, null, 2));
    archive.append(metadataBuffer, { name: 'metadata.json' });
    
    // Add captures
    if (data.captures && data.captures.length > 0) {
      data.captures.forEach(capture => {
        if (fs.existsSync(capture.filepath)) {
          archive.file(capture.filepath, { 
            name: `captures/${path.basename(capture.filepath)}`
          });
        }
      });
    }

    archive.finalize();
  });
};
module.exports = { createAndDownloadZip };