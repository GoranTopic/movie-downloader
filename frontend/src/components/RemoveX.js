import React from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

/**
 * RemoveX component - displays an X button in the top right corner for deletion
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onDelete - Function to call when the X is clicked
 * @param {boolean} props.disabled - Whether the button should be disabled
 * @param {Object} props.sx - Additional styles to apply to the button
 * @returns {JSX.Element} RemoveX component
 */
export default function RemoveX({ onDelete, disabled = false, sx = {} }) {
  return (
    <IconButton
      onClick={onDelete}
      aria-label="delete"
      disabled={disabled}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        color: 'rgba(0, 0, 0, 0.43)',
        zIndex: 1,
        padding: '2px',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        ...sx
      }}
    >
      <CloseIcon />
    </IconButton>
  );
} 