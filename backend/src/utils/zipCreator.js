const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const createAndDownloadZip = async ({ trials, responses, captures, metadata }) => {
  const zipPath = path.join(process.cwd(), 'exports', `session-${metadata.sessionId}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', err => reject(err));

    archive.pipe(output);

    // Add experiment data
    archive.append(JSON.stringify({ 
      trials, 
      responses, 
      metadata,
      captureMetadata: captures.map(c => ({
        timestamp: c.timestamp,
        settings: c.settings,
        filename: c.filename
      }))
    }, null, 2), { name: 'experiment-data.json' });
    
    // Add captures in chronological order
    captures.forEach(capture => {
      if (fs.existsSync(capture.filepath)) {
        const captureFileName = `captures/${capture.timestamp}.jpg`;
        archive.file(capture.filepath, { name: captureFileName });
      }
    });

    archive.finalize();
  });
};
module.exports = { createAndDownloadZip };