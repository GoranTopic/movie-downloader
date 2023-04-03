import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';


export default function SuggestionCard({ suggestion, selectTorrent }) {

    const choose_default_torrent = suggestion => {
        // this function will choses the torrent with the 1080p quality if there is as default
        // else it will chose the first torrent in the list
        let default_torrent = suggestion.torrents[0];
        for (let torrent of suggestion.torrents) {
            if (torrent.quality === "1080p") {
                return default_torrent = torrent;
            }
        }
        return default_torrent;
    }

    // the torrent url to pass to the transmission client
    const [torrent, setTorrent] = React.useState(choose_default_torrent(suggestion));
    const [url, setUrl] = React.useState(choose_default_torrent(suggestion).url);
    // set the 1080 torrent as the default as soon as it loads

    const handleChange = event => {
        console.log('value:', event.target.value);
        let torrent = suggestion.torrents.filter(torrent => torrent.url === event.target.value)[0];
        setTorrent(torrent);
        setUrl(torrent.url);
    };

    return (
        <Card sx={{ display: 'flex' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                <CardMedia
                    component="img"
                    sx={{ width: 51 }}
                    image={suggestion.small_cover_image}
                    alt={suggestion.title}
                />
                <CardContent sx={{ flex: '1 0 auto' }}>
                    <Typography component="div" > {suggestion.title} </Typography>
                    <Typography variant="subtitle1" color="text.secondary" component="div">
                        ({suggestion.year}) - {suggestion.rating} - {suggestion.language} -
                        {suggestion.genres ? suggestion.genres.map(genre => genre + " ") : ""}
                    </Typography>
                </CardContent>
                {/* add imbd icon button link */}
                <FormControl>
                    <Box sx={{ display: 'flex', alignSelf: 'right', alignItems: 'center', pl: 1, pb: 1 }}>
                        <RadioGroup aria-label="quality" name="quality"
                            onChange={e => handleChange(e)}
                            defaultValue={choose_default_torrent(suggestion).url}>
                            {suggestion.torrents.map(torrent =>
                                <FormControlLabel
                                    key={torrent.url}
                                    value={torrent.url}
                                    size="small"
                                    label={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2" fontSize={16} p={0.2}> {torrent.type} </Typography>
                                        <Typography variant="subtitle2" fontSize={16} p={0.2}> {torrent.quality} </Typography>
                                        <Typography variant="subtitle2" fontSize={16} p={0.2}> {torrent.size} </Typography>
                                    </Box>}
                                    control={<Radio />}
                                />
                            )}
                        </RadioGroup>
                        <IconButton 
                            aria-label="download" 
                            onClick={() => selectTorrent(suggestion, torrent)}>
                            <FileDownloadIcon sx={{ height: 38, width: 38 }} />
                        </IconButton>
                    </Box>
                </FormControl>
            </Box>
        </Card>
    );
}