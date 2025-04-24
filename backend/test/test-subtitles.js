import { downloadAllSubtitles } from '../src/ytsSubtitleApi.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DOWNLOADS_PATH } from '../src/config.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a test directory
const testDir = path.join(DOWNLOADS_PATH, 'subtitle-test');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
}

// List of popular movies with their IMDB IDs to test with
const testMovies = [
    { title: 'The Shawshank Redemption', imdbId: 'tt0111161' },
    { title: 'Inception', imdbId: 'tt1375666' },
    { title: 'The Matrix', imdbId: 'tt0133093' },
    { title: 'Interstellar', imdbId: 'tt0816692' },
    { title: 'Parasite', imdbId: 'tt6751668' }
];

// Function to run tests
async function runTests() {
    console.log('Starting subtitle download tests...');
    console.log('Test directory:', testDir);
    
    for (const movie of testMovies) {
        console.log(`\n============================================`);
        console.log(`Testing subtitles for: ${movie.title} (${movie.imdbId})`);
        console.log(`============================================`);
        
        // Create movie-specific directory
        const movieDir = path.join(testDir, movie.title.replace(/[/\\?%*:|"<>]/g, '-'));
        if (!fs.existsSync(movieDir)) {
            fs.mkdirSync(movieDir, { recursive: true });
        }
        
        try {
            const startTime = Date.now();
            
            // Download subtitles
            const subtitles = await downloadAllSubtitles(movie.imdbId, movieDir);
            
            const endTime = Date.now();
            const executionTime = (endTime - startTime) / 1000; // in seconds
            
            if (!subtitles || subtitles.length === 0) {
                console.log(`✖ No subtitles found for ${movie.title}`);
            } else {
                console.log(`✓ Successfully downloaded ${subtitles.length} subtitles for ${movie.title}`);
                console.log('Subtitles:');
                
                subtitles.forEach((sub, index) => {
                    console.log(`  ${index + 1}. Language: ${sub.language}`);
                    console.log(`     Path: ${sub.subtitlePath}`);
                    
                    // Verify file exists
                    const fullPath = path.join(movieDir, sub.subtitlePath);
                    const exists = fs.existsSync(fullPath);
                    if (exists) {
                        const stats = fs.statSync(fullPath);
                        console.log(`     Size: ${stats.size} bytes`);
                        console.log(`     Status: ✓ File exists`);
                    } else {
                        console.log(`     Status: ✖ File does not exist`);
                    }
                });
            }
            
            console.log(`Execution time: ${executionTime.toFixed(2)} seconds`);
            
        } catch (error) {
            console.error(`Error testing ${movie.title}:`, error);
        }
    }
    
    console.log('\nAll tests completed!');
}

// Run the tests
runTests()
    .then(() => console.log('Test script finished.'))
    .catch(err => console.error('Error running tests:', err)); 