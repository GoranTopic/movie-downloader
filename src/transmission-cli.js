import Transmission from  'transmission'

let transmission = new Transmission({
    host: '0.0.0.0',
    port: 9091
})



const add_torrent = async torrent_url => 
    new Promise( async (resolve, reject) => 
        await transmission.addUrl( 
            torrent_url, // add torrent
            { "download-dir" : "/var/www/.movies" },
            (err, res) => {
                 if(err){ 
                    console.error(err); 
                    reject(err)
                }else{
                    var id = res.id;
                    console.log('Torrent added to transmission.');
                    resolve(id);
                }
            }
        )
    );


const delete_torrent =  async (torrent_id, delete_file=false) => 
    new Promise( async (resolve, reject ) => 
        await transmission.remove(
            torrent_id, 
            delete_file,
            (err, res) => {
                if(err)
                    reject(err); 
                else
                    resolve( true);
            }
        )
    )

const check_torrent_status =  async torrent_id => 
    new Promise( async (resolve, reject ) => 
        await transmission.get(
            torrent_id, 
            (err, res) => {
                if(err)
                    reject(err); 
                else
                    resolve( res.torrents[0] );
            }
        )
    )

// Get torrent state
function getStatusType(type){
    return transmission.statusArray[type]
}

export { getStatusType, add_torrent, delete_torrent, check_torrent_status }