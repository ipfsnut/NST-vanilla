const JSZip = require('jszip');
const fs = require('fs').promises;
const path = require('path');

const createAndDownloadZip = async (data) => {
  const zip = new JSZip();
  const tempDir = path.join(process.cwd(), 'temp');
  
  // Ensure temp directory exists
  await fs.mkdir(tempDir, { recursive: true });
  
  const zipFileName = path.join(tempDir, `nst_export_${Date.now()}.zip`);

  // Add data files
  zip.file('data.csv', data['data.csv']);
  zip.file('data.json', data['data.json']);

  // Add captures to a separate folder
  if (data.captures && data.captures.length > 0) {
    const capturesFolder = zip.folder('captures');
    for (const capture of data.captures) {
      try {
        const imageData = await fs.readFile(capture.filepath);
        const filename = path.basename(capture.filepath);
        capturesFolder.file(filename, imageData);
      } catch (error) {
        console.log(`Skipping capture ${capture.filepath}: ${error.message}`);
      }
    }
  }

  // Generate and save zip file
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(zipFileName, content);

  console.log('Archive created:', zipFileName, `(${content.length} bytes)`);
  return zipFileName;
};

module.exports = { createAndDownloadZip };