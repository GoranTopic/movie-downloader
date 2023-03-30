import fs from 'fs'

const write_json = (obj, path) => {
    try{
        let str = JSON.stringify(obj)
        fs.writeFileSync(path, str);
        return true
    }catch(e) {
        debugging && console.error('could not write file');
        return false
    }
}

const read_json = path => {
    try{
        let str = fs.readFileSync(path);
        return JSON.parse(str)
    }catch(e) {
        debugging && console.error('could not read file ' + e);
        return null
    }
}

const delete_json = path => {
    try{
        return fs.unlinkSync(path);
    }catch(e) {
        debugging && console.error('could not delete json file ' + e);
        return null
    }
}

const fileExists = path =>{
    try{
        return fs.existsSync(path)
    }catch(e) {
        debugging && console.error('could not find file ' + e);
        return false
    }
}

/**
 * mkdir.
 * this is a humble function that make a directory that is passed
 * if creates the directories recursibly
 *
 * @param {string} path to directory
 * relative paths are from the current working dir
 * ex:./data/mined/companies
 */
const mkdir = path => 
    // If current directory does not exist then create it
    fs.mkdir(path, { recursive: true }, error => {
       if(error) console.error(error)
    });

/**
 * write_binary_file.
 * this function writes down a binary file to disk
 *
 * @param {} bin_file
 * @param {} path
 */
const write_binary_file = ( bin_file, path ) => {
    fs.writeFileSync(path, bin_file);
}


export { write_json, read_json, write_binary_file, delete_json, mkdir, fileExists }

