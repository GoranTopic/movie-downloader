import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { query_movie_suggestions } from '../yify-cli.js';
import SuggestionCard from './SuggestionCard.js';
//import { transmision_add_torrent } from './transmission-client.js';

export default function MovieSearchBar() {
    /* this is the companent that will be used to search for a movie using the yify api
     * when a movie is selecte it donwload the torrent file and passes it to 
     * transmission-remote client*/
    //  variables to handle the search bar states
    // open: is the search bar open
    const [open, setOpen] = React.useState(false);
    // suggestions: is the list of suggestions queries form the yify 
    const [suggestions, setSuggestions] = React.useState([]);
    // textValue: is the value of the text search
    const [textValue, setTextValue] = React.useState("");
    // loading: is wether is qeuring search bar loading
    const [loading, setLoading] = React.useState(false);
    // would this be loagin if there are no query result?

    React.useEffect(() => {
        // set as active?
        let active = true;
        // if(textValue) active = true;
        (async () => {
            if (active && textValue !== "") {
                //console.log("search query:", textValue);
                setLoading(true);
                // query suggestions
                let suggestions = await query_movie_suggestions(textValue);
                //console.log("got search suggestions:", quotes);
                setSuggestions([...suggestions]);
                setOpen(true);
                setLoading(false);
            }
        })();
        // return a function that will be called when the component is unmounted
        return () => { active = false; };
        // every time the textValue changes
    }, [textValue]);

    const selectTorrent = torrent_url => {
        /* this function uses the selected movie suggestion to download the torrent file
         * and pass it to transmission-remote client*/
        setTextValue('');
        setOpen(false);
        setSuggestions([]);
        console.log("torret_url", torrent_url);
        //transmision_add_torrent(torrent_url);
    }


    return <>
        <Autocomplete
            sx={{ marginX: "5%" }}
            id="Stock Search"
            autoHighlight
            open={open}
            onOpen={() => ((suggestions.length > 0) && setOpen(true))}
            onClose={() => setOpen(false)}
            // this is the list of suggestion
            options={suggestions}
            // this is the function get a label from a suggestion
            getOptionLabel={suggestion => suggestion.title}
            // this render the suggestion
            renderOption={(event, suggestion) =>
                <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    selectTorrent={selectTorrent} />
            }
            // change value of the text search
            inputValue={textValue}
            // when the text search changes
            onInputChange={event => (event && event?.target?.value !== null) && setTextValue(event.target.value)}
            // loading state
            loading={loading}
            // this is the textinput component of the search bar
            renderInput={params => (
                <TextField
                    {...params}
                    label="Search Movie"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />
    </>
}
