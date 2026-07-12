// Dependencies
import request from 'request';
import * as cheerio from 'cheerio';
import extract from 'extract-zip';
import pkg from 'follow-redirects';
const { https } = pkg;
import fs from 'fs';
import { convert } from 'subtitle-converter';
import path from 'path';

// Base URL (the .org domain now redirects here; the .ch zip
// downloads return 403 unless a Referer header is sent)
const baseURL = 'https://yifysubtitles.ch'

// Search by IMDB id
let getSubs = (id, cb) => {
  if (!id.startsWith('tt')) id = `tt${id}`
  let searchURL = `${baseURL}/movie-imdb/${id}`
  
  // Configure request to follow redirects
  const options = {
    url: searchURL,
    followAllRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  }

  request(options, (err, res, body) => {
    if (!err && res.statusCode == 200) {
      let $ = cheerio.load(body)

      // Subtitles list
      let subs = []
      $('table.table tbody tr').each(function() {
        let sub = {
          lang: $(this).find('td').eq(1).text().trim(),
          name: $(this).find('td').eq(2).find('a').text().trim().replace('subtitle ', ''),
          url: `${baseURL}/subtitle/` + $(this).find('td').eq(2).find('a').attr('href').split('/')[2] + '.zip',
          uploader: $(this).find('td').eq(4).text().trim(),
          rating: $(this).find('td').first().text().trim()
        }
        subs.push(sub)
      })

      // Available languages
      let langs = Array.from(new Set(subs.map(x => x.lang)))

      // Results callback
      if (subs.length > 0) {
        subs.sort((a, b) => b.rating - a.rating)
        cb(null, {langs, subs_count: subs.length, subs})
      } else {
        cb(null, {subs: 'No subtitles were found'})
      }
    } else {
      // Error callback
      console.error('Error fetching subtitles:', err || `Status code: ${res?.statusCode}`)
      cb(null, err || new Error(`HTTP Error: ${res?.statusCode}`))
    }
  })
}

/**
 * Ensures the directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Extract filename from URL
 * @param {string} url - URL to extract filename from
 * @returns {string} Extracted filename
 */
function extractFilenameFromUrl(url) {
    const urlParts = url.split('/');
    if (urlParts.length < 5) {
        throw new Error(`Invalid URL format: ${url}`);
    }
    return urlParts[urlParts.length - 1];
}

/**
 * Creates HTTP options for subtitle download requests
 * @returns {Object} HTTP request options
 */
function createHttpOptions() {
    return {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            // the download host rejects requests without a Referer with a 403
            'Referer': `${baseURL}/`
        },
        maxRedirects: 5
    };
}

/**
 * Downloads a file from a URL
 * @param {string} url - URL to download from
 * @param {string} filePath - Path to save the file to
 * @returns {Promise<void>} Promise that resolves when download is complete
 */
function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const options = createHttpOptions();
        const file = fs.createWriteStream(filePath);
        
        const req = https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400) {
                // Handle redirect
                const redirectUrl = res.headers.location;
                console.log('Redirecting to:', redirectUrl);
                file.close();
                fs.unlinkSync(filePath);
                
                // Recursively download from the redirect URL
                downloadFile(redirectUrl, filePath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP Error: ${res.statusCode}`));
                return;
            }
            
            res.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve();
            });
            
            file.on('error', (err) => {
                fs.unlink(filePath, () => {});
                reject(err);
            });
        });
        
        req.on('error', (err) => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

/**
 * Extracts a ZIP file
 * @param {string} zipPath - Path to the ZIP file
 * @param {string} extractDir - Directory to extract to
 * @returns {Promise<string>} Promise that resolves with the name of the extracted file
 */
function extractZipFile(zipPath, extractDir) {
    return new Promise(async (resolve, reject) => {
        let extractedFile = null;
        await extract(zipPath, {
            dir: extractDir,
            onEntry: (entry) => {
                console.log('Extracting...', entry.fileName);
                extractedFile = entry.fileName;
            }
        }, (err) => {
            console.log('Extraction callback');
            if (err) {
                console.error('Extraction error:', err);
                reject(err);
                return;
            }
        });
        resolve(extractedFile);
    });
}

/**
 * Converts a subtitle file to VTT format
 * @param {string} subtitlePath - Path to the subtitle file
 * @param {string} outputDir - Directory to save the VTT file
 * @param {string} language - Language of the subtitle
 * @returns {Promise<string>} Promise that resolves with the path to the VTT file
 */
function convertSubtitleToVtt(subtitlePath, outputDir, language) {
    return new Promise((resolve, reject) => {
        try {
            const subtitleText = fs.readFileSync(subtitlePath, 'utf8');
            
            const { subtitle, status } = convert(subtitleText, '.vtt', {
                removeTextFormatting: true,
                combineOverlapping: true,
            });
            
            if (!status.success) {
                reject(new Error(`Conversion failed: ${status.message}`));
                return;
            }
            
            // Create temp VTT file with original name
            const baseName = path.basename(subtitlePath, path.extname(subtitlePath));
            const tempVttFile = path.join(outputDir, `${baseName}.vtt`);
            fs.writeFileSync(tempVttFile, subtitle);
            
            // Rename to language-based filename with incrementing counter
            let counter = 1;
            let vttFile = `${language} (${counter}).vtt`;
            while (fs.existsSync(path.join(outputDir, vttFile))) {
                counter++;
                vttFile = `${language} (${counter}).vtt`;
            }
            
            const finalVttPath = path.join(outputDir, vttFile);
            fs.renameSync(tempVttFile, finalVttPath);
            
            resolve(vttFile);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Cleans up temporary files
 * @param {string[]} filePaths - Paths to files to delete
 */
function cleanupFiles(filePaths) {
    for (const filePath of filePaths) {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error(`Error deleting file ${filePath}:`, error);
            }
        }
    }
}

/**
 * Downloads a subtitle from a URL and converts it to VTT format
 * @param {string} url - URL to download the subtitle from
 * @param {string} outputDir - Directory to save the subtitle to
 * @param {string} language - Language of the subtitle
 * @param {Function} cb - Callback function (subtitle path, error)
 */
async function downloadSub(url, outputDir, language, cb) {
    let zipPath = null;
    let extractedFilePath = null;
    try {
        
        // Extract filename from URL and create download path
        const filename = extractFilenameFromUrl(url);
        zipPath = path.join(outputDir, filename);
        
        console.log('Downloading subtitle:', url);
        console.log('Output directory:', outputDir);
        
        // 1. Download the ZIP file
        await downloadFile(url, zipPath);
        console.log('Download completed:', zipPath);
        
        // 2. Extract the ZIP file
        const extractedFile = await extractZipFile(zipPath, outputDir);
        console.log('Extraction completed, extracted file:', extractedFile);
        
        if (!extractedFile) {
            throw new Error('No file extracted from ZIP');
        }
        
        extractedFilePath = path.join(outputDir, extractedFile);
        
        // 3. Convert the subtitle to VTT
        const vttFile = await convertSubtitleToVtt(extractedFilePath, outputDir, language);
        console.log('Conversion completed, VTT file:', vttFile);
        
        // 4. Clean up temporary files
        cleanupFiles([zipPath, extractedFilePath]);
        console.log('Cleanup completed');
        
        // 5. Return the VTT file path
        if (cb) cb(vttFile, null);
    } catch (error) {
        console.error('Error in downloadSub:', error);
        if (cb) cb(null, error);
    } finally {
        cleanupFiles([zipPath, extractedFilePath]);
    }
}

async function downloadAllSubtitles(imdbId, targer_dir) {
    console.log(`\nTesting subtitle download for movie: ${imdbId}`);
    const downloaded_subtitles = [];
    try {
        // Get available subtitles
        const results = await new Promise((resolve, reject) => {
            getSubs(imdbId, (err, data) => {
                if (err) {
                    console.error('Error getting subtitles:', err);
                    reject(err);
                } else {
                    console.log('Received subtitle data:', JSON.stringify(data, null, 2));
                    resolve(data);
                }
            });
        });

        if (!results || !results.subs || results.subs === 'No subtitles were found') {
            console.log('No subtitles found for this movie');
            return [];
        }
        
        // for every language, get the first 5 subtitles best rated
        let languages = results.langs;
        let subtitles = [];
        for (let lang of languages) {
            let subs = results.subs.filter(sub => sub.lang === lang);
            // sort by rating
            subs.sort((a, b) => b.rating - a.rating);
            // push the first 3 if there that many
            for (let i = 0; i < Math.min(subs.length, 3); i++) {
                subtitles.push(subs[i]);
            }
        }

        // for every language, download the first subtitle
        for (let subtitle of subtitles) {
            console.log(`Downloading subtitles for language: ${subtitle.lang}`);
            // Create movie-specific directory
            ensureDirectoryExists(targer_dir);
            
            // Download the subtitles
            try {
                let sub = await new Promise((resolve, reject) => {
                    downloadSub(subtitle.url, targer_dir, subtitle.lang, (sub, err) => {
                        if (err) {
                            console.error('Error downloading subtitles:', err);
                            reject(err);
                        } else {
                            console.log('Subtitles downloaded successfully');
                            resolve(sub);
                        }
                    });
                });
                
                if (sub) {
                    downloaded_subtitles.push({language: subtitle.lang, subtitlePath: sub});
                }
            } catch (err) {
                console.error('Error downloading subtitles:', err);
                // Continue with other subtitles even if one fails
            }
        }
    } catch (error) {
        console.error('Error in downloadAllSubtitles:', error);
    }
    return downloaded_subtitles;
}

// Export Functions
export { 
    getSubs, 
    downloadSub, 
    downloadAllSubtitles,
    // Also export the utility functions for testing and reuse
    ensureDirectoryExists,
    extractFilenameFromUrl,
    downloadFile,
    extractZipFile,
    convertSubtitleToVtt,
    cleanupFiles
};