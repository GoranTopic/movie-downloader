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
        top: 2,
        left: 2,
        color: 'text.disabled',
        zIndex: 1,
        padding: '2px',
        transition: 'color 0.15s ease',
        '&:hover': {
          color: 'error.main',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
        ...sx
      }}
    >
      <CloseIcon />
    </IconButton>
  );
} 
