import React, { useState } from 'react';

const RegisterDevice = ({ qrData, location, apiUrl, onRegistrationSuccess }) => {
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
            qrData,
            location,
            username,
            password,
        };

        try {
            const response = await fetch(`${apiUrl}/qr/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Ошибка: ${response.message}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                onRegistrationSuccess();
            } else {
                setRegistrationError(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setRegistrationError('Ошибка регистрации');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900 p-2">
            <div className="w-full max-w-md bg-gray-800 text-white p-6 rounded-lg">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold mb-2">Зарегистрировать Рабочую Станцию</h2>
                    <p className="text-gray-400">
                        Введите логин и пароль для регистрации
                    </p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium mb-1">
                            Логин
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium mb-1">
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    {registrationError && (
                        <p className="mb-4 text-red-400 text-sm">{registrationError}</p>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-500 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        {isSubmitting ? 'Регистрация...' : 'Регистрация'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterDevice;
