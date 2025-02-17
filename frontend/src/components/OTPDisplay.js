import React, { useState, useEffect } from 'react';

const OTPDisplay = () => {
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const circumference = 2 * Math.PI * 48; // Full circumference of the circle

    const seededRandom = (seed) => {
        const m = 2147483647;
        const a = 16807;
        let s = seed % m;
        if (s <= 0) s += m; // Ensure the seed is positive
        return () => {
            s = (a * s) % m;
            return s / m;
        };
    };

    const generateOTP = (seed) => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const rand = seededRandom(seed);
        let result = '';
        for (let i = 0; i < 5; i++) {
            const index = Math.floor(rand() * chars.length);
            result += chars[index];
        }
        return result;
    };

    const calculateProgress = () => {
        return (30 - timeLeft) / 30;
    };

    useEffect(() => {
        const update = () => {
            const now = Date.now();
            const currentEpoch = Math.floor(now / 30000) * 30000;
            const nextEpoch = currentEpoch + 30000;
            const secondsLeft = Math.ceil((nextEpoch - now) / 1000);

            setTimeLeft(secondsLeft);
            setOtp((prevOtp) => {
                const newOtp = generateOTP(currentEpoch);
                return newOtp !== prevOtp ? newOtp : prevOtp;
            });
        };

        const timerId = setInterval(update, 1000);
        update(); // Initial call to set OTP and time left

        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900 p-2">
            <div className="w-full max-w-md bg-gray-800 text-white p-6 rounded-lg">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold mb-2">OTP GUARD</h2>
                    <p className="text-gray-400">Введите код для подтверждения логина</p>
                </div>

                <div className="relative mx-auto w-48 h-48 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-700" />

                    <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="48"
                            fill="none"
                            stroke="#0096FF"
                            strokeWidth="4"
                            strokeDasharray={`${calculateProgress() * circumference} 1000`}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <div className="text-3xl font-bold tracking-wider">{otp}</div>
                        <div className="text-sm text-gray-400 mt-1">{timeLeft}s</div>
                    </div>
                </div>

                <button
                    onClick={() => navigator.clipboard.writeText(otp)}
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Скопировать
                </button>
            </div>
        </div>
    );
};

export default OTPDisplay;