import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { login, signup } from '../auth-cli';

export default function AuthModal({ open, onClose, onAuthenticated }) {
    // 0 = login, 1 = sign up
    const [tab, setTab] = React.useState(0);
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [info, setInfo] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setBusy(true);
        setError('');
        setInfo('');
        try {
            if (tab === 0) {
                const user = await login(username, password);
                // reset the form and hand the user back to the app
                setUsername('');
                setPassword('');
                onAuthenticated(user);
            } else {
                const result = await signup(username, password, email);
                // account created but not usable yet: point them at their inbox
                setInfo(`Verification email sent to ${result.email}. `
                    + `Click the link in it, then log in as "${result.username}".`);
                setEmail('');
                setPassword('');
                setUsername(result.username);
                setTab(0);
            }
        } catch (err) {
            setError(err.message || 'Something went wrong, please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Sign in or create an account</DialogTitle>
            <DialogContent>
                <Tabs value={tab} onChange={(e, v) => { setTab(v); setError(''); setInfo(''); }} sx={{ mb: 1 }}>
                    <Tab label="Login" />
                    <Tab label="Sign Up" />
                </Tabs>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Signed-in users keep their movies for 12 hours — guests only get 4.
                </Alert>
                <Box component="form" onSubmit={handleSubmit}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        helperText={tab === 1 ? 'Leave blank to get a random name' : ''}
                        autoFocus
                        fullWidth
                    />
                    {tab === 1 && (
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            helperText="A verification link will be sent here"
                            fullWidth
                        />
                    )}
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        fullWidth
                    />
                    {error && <Alert severity="error">{error}</Alert>}
                    {info && <Alert severity="success">{info}</Alert>}
                    {/* hidden submit so pressing Enter works */}
                    <button type="submit" style={{ display: 'none' }} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    variant="contained"
                    fullWidth
                    disabled={busy || !password || (tab === 0 && !username) || (tab === 1 && !email)}
                    onClick={handleSubmit}
                >
                    {tab === 0 ? 'Login' : 'Create Account'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
