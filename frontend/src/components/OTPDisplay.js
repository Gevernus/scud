import React, { useState, useEffect } from 'react';

const OTPDisplay = () => {
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);

    const generateOTP = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    };

    const calculateProgress = () => {
        return ((30 - timeLeft) / 30) * 100;
    };

    const resetTimer = () => {
        setTimeLeft(30);
        setOtp(generateOTP());
    };

    useEffect(() => {
        setOtp(generateOTP());

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) {
                    resetTimer();
                    return 30;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900 p-2">
            <div className="w-full max-w-md bg-gray-800 text-white p-6 rounded-lg">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold mb-2">OTP GUARD</h2>
                    <p className="text-gray-400">Enter this code to confirm your sign in</p>
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
                            strokeDasharray={`${calculateProgress() * 3.14}, 1000`}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <div className="text-3xl font-bold tracking-wider">{otp}</div>
                    </div>
                </div>

                <button
                    onClick={() => navigator.clipboard.writeText(otp)}
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Copy Code
                </button>
            </div>
        </div>
    );
};

export default OTPDisplay;