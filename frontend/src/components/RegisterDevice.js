import React, { useState } from 'react';

const RegisterDevice = ({ pendingData, apiUrl, onRegistrationSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [registrationError, setRegistrationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setRegistrationError('');
        setIsSubmitting(true);

        // Build payload combining the scan data with the registration credentials.
        const payload = {
            ...pendingData,
            username,
            password,
        };

        try {
            const response = await fetch(`${apiUrl}/device/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                onRegistrationSuccess();
            } else {
                setRegistrationError(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setRegistrationError('Error during registration');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-device">
            <h2>Register Device</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {registrationError && <p className="error">{registrationError}</p>}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering...' : 'Register Device'}
                </button>
            </form>
        </div>
    );
};

export default RegisterDevice;
