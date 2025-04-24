import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { query_movie_suggestions } from '../yify-cli.js';
import SuggestionCard from './SuggestionCard.js';

export default function MovieSearchBar({ selectSuggestion }) {
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
    const [debouncedValue, setDebouncedValue] = React.useState("");
    const timeoutRef = React.useRef(null);

    // Debounce effect
    React.useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(textValue);
        }, 300);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [textValue]);

    // Search effect
    React.useEffect(() => {
        let active = true;

        (async () => {
            if (active && debouncedValue !== "") {
                console.log("search query:", debouncedValue);
                setLoading(true);
                try {
                    let suggestions = await query_movie_suggestions(debouncedValue);
                    console.log("got search suggestions:", suggestions);
                    if (active) {
                        setSuggestions(suggestions);
                        setOpen(true);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    if (active) {
                        setLoading(false);
                    }
                }
            }
        })();

        return () => { active = false; };
    }, [debouncedValue]);

    const selectTorrent = async (torrent, quality) => {
        /* this function uses the selected movie suggestion to download the torrent file
         * and pass it to transmission-remote client*/
        // clear the search bar
        setTextValue('');
        // close the search bar
        setOpen(false);
        // clear the suggestions
        setSuggestions([]);
        //console.log("torret:", torrent);
        //console.log("quality:", quality);
        // send the torrent to the transmission server to download
        await selectSuggestion(torrent, quality);
    }

    return <>
        <Autocomplete
            sx={{ marginX: "5%", marginBottom: "1rem" }}
            id="Stock Search"
            autoHighlight
            variant="standard"
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
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    </>
}
