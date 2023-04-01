import * as React from 'react';
import styled from 'styled-components';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Grow from '@mui/material/Grow';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import stylize from '../utils/stylize.js';


const StyledPaper = stylize(Card,  //use Paper to debug
    ({ theme, $expand }) => ({
        cursor: $expand ? 'default' : 'pointer',
        backgroundColor: theme.palette.secondary.main,
        transition: theme.transitions.create(['background-color', 'transform', 'width', 'height'], {
            duration: theme.transitions.duration.standard,
        }),
        "&:hover": {
            backgroundColor: $expand ? theme.palette.secondary.main : theme.palette.primary.main,
            transform: $expand ? 'scale(1)' : 'scale(1.05)'
        },
        alignContent: 'stretch',
        display: 'table',
        height: 'auto',//$expand ? 700 : 300,
        maxWidth: $expand? 'auto' : 450,
    })
);

const StyledAvatar = stylize(Avatar,
    ({ theme, $expand }) => ({
        transition: theme.transitions.create(['background-color', 'transform'], {
            duration: theme.transitions.duration.standard,
        }),
        "&:hover": {
            transform: 'scale(1.3)',
            //transform: $expand ? 'rotate(-30deg)' : 'rotate(0deg)',
            //transform: 'rotate(30deg)',
        },
    })
);

// this seem awfully like magic, can i make Expandable Paper more liek this?
const createIcon = styled(props => {
    const { $expand, ...other } = props;
    return <IconButton { ...other } />;
  }) 

const ExpandMore = createIcon(({ theme, $expand }) => ({
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.complex + 100000,
    }),
    transform: $expand ? 'rotate(0deg); scale(2);' : 'rotate(180deg); scale(1);',
}));

function scrollToTop(smooth=true) {
    if (smooth) {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    } else {
        document.documentElement.scrollTop = 0;
    }
}

export default function ExpandableCard({ stocks, title, subheader, timeout, children }) {
    const [expand, setExpand] = React.useState(false);
    const toggleExpand = () => setExpand(!expand);
    const expandCard = () => {
        if (!expand) {
            setExpand(true);
            scrollToTop(true);
        }
    }

    timeout = timeout ?? 1000
    /* this function passes the expand prop to teh children compnent */
    let childrenWithProps = React.Children.map(children, child => // pass props to children 
        React.isValidElement(child) ? React.cloneElement(child, { expand }) : child)

    return <>
        <Grow in={true} style={{ transformOrigin: '0 0 0' }} {...(true ? { timeout: timeout } : {})}  >
            <Grid container item justifyContent="center" alignItems="center" style={{ textAlign: "center" }}
                xs={14} sm={expand ? 14 : 8} md={expand ? 14 : 4} lg={expand ? 14 : 4} xl={expand ? 14 : 4} order={expand ? 1 : 2} >
                <StyledPaper $expand={expand} onClick={expandCard} elevation={5} >
                    <CardHeader avatar={
                        <Grid container item justifyContent='center' alignItems="center">
                            {stocks.map(stock => // maybe find a way to add company logo in src={}
                                <StyledAvatar sx={{
                                    backgroundColor: stock.color.topColor,
                                    marginX: '2%'
                                }} alt={stock.symbol} key={stock.symbol}>
                                    {stock.symbol}
                                </StyledAvatar>)}
                        </Grid>}
                        action={
                            <ExpandMore $expand={expand} onClick={toggleExpand} aria-expanded={expand} aria-label="show more">
                                <ExpandMoreIcon />
                            </ExpandMore>
                        }
                        title={<Typography variant="header" color="text.primary"> {title} </Typography>}
                        subheader={<Typography variant="body1" color="text.secondary"> {subheader} </Typography>} />
                    { // render children, which the card content
                        childrenWithProps
                    }
                    {expand && // if it i expanded add a botom thing to close
                        <CardActions sx={{ justifyContent: 'center' }}>
                            <Button size="medium" variant="contained" onClick={toggleExpand}>Close</Button>
                        </CardActions>}
                </StyledPaper>
            </Grid>
        </Grow>
    </>
}