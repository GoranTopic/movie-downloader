import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #f44336',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    p: 4,
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
};

const iconStyle = {
    color: '#f44336',
    fontSize: 48,
    mb: 2,
};

const buttonStyle = {
    mt: 2,
    backgroundColor: '#f44336',
    '&:hover': {
        backgroundColor: '#d32f2f',
    },
};

export default function ErrorModal({ open, onClose, errorMessage }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="error-modal-title"
            aria-describedby="error-modal-description"
            sx={{
                backdropFilter: 'blur(3px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
        >
            <Box sx={style}>
                <ErrorOutlineIcon sx={iconStyle} />
                <Typography 
                    id="error-modal-title" 
                    variant="h5" 
                    component="h2"
                    sx={{ 
                        color: '#f44336',
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}
                >
                    Network Error
                </Typography>
                <Typography 
                    id="error-modal-description" 
                    sx={{ 
                        mt: 2,
                        textAlign: 'center',
                        color: 'text.primary',
                    }}
                >
                    {errorMessage}
                </Typography>
                <Button 
                    onClick={onClose} 
                    variant="contained" 
                    sx={buttonStyle}
                    size="large"
                >
                    Close
                </Button>
            </Box>
        </Modal>
    );
} 