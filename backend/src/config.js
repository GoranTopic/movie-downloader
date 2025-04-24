import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get downloads path from environment or use default
const DOWNLOADS_PATH = process.env.DOWNLOADS_PATH 
    ? path.resolve(process.env.DOWNLOADS_PATH)
    : path.join(process.cwd(), 'downloads');

export {
    DOWNLOADS_PATH
}; 