import * as React from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { getPercentageOf, bytesToHumanReadable, userColor } from '../utils';

export default function LinearProgressMemory({ used, claimed, total, torrents = [], user }) {
    // how much of the disk the current user's movies take up
    const personal = torrents
        .filter(t => user && t.owner === user.username)
        .reduce((sum, t) => sum + (t.totalSize || 0), 0);

    const claimedPct = getPercentageOf(claimed || 0, total || 1);
    const usedPct = getPercentageOf(used || 0, total || 1);
    const personalPct = getPercentageOf(personal, total || 1);
    const color = user ? userColor(user.username) : 'grey';

    // no text labels; the details live in the tooltip
    const tooltip = `You: ${bytesToHumanReadable(personal)} · ` +
        `Server: ${bytesToHumanReadable(used || 0)} used, ` +
        `${bytesToHumanReadable(claimed || 0)} claimed of ${bytesToHumanReadable(total || 0)}`;

    return (
        <Box sx={{ marginX: '5%', marginBottom: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title={tooltip} arrow>
                <Box sx={{
                    width: { xs: '100%', md: '40%' },
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'action.hover',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* space claimed by all downloads still in progress */}
                    <Box sx={{
                        position: 'absolute', height: '100%',
                        width: `${claimedPct}%`,
                        backgroundColor: 'action.selected',
                    }} />
                    {/* space used by everyone */}
                    <Box sx={{
                        position: 'absolute', height: '100%',
                        width: `${usedPct}%`,
                        backgroundColor: 'primary.main',
                        opacity: 0.4,
                    }} />
                    {/* space used by the current user, in their color */}
                    <Box sx={{
                        position: 'absolute', height: '100%',
                        width: `${personalPct}%`,
                        backgroundColor: color,
                    }} />
                </Box>
            </Tooltip>
        </Box>
    );
}
