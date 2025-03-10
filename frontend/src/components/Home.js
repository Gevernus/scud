import '../App.css';
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import OTPDisplay from './OTPDisplay';
import RegisterDevice from './RegisterDevice';
import RegisterForm from './RegisterForm';
import NfcButton from './NfcButton';
import { useUser } from '../context/UserContext';


const Home = () => {
    // State for different UI screens
    const [showOTPDisplay, setShowOTPDisplay] = useState(false);
    const [location, setLocation] = useState(null);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [showNfc, setShowNfc] = useState(false);
    // We store the scanned data in case the device needs registration.
    const [qrData, setQrData] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const { user, loading, accessDenied, registrationAllowed, blockReason } = useUser();

    const PERMISSION_ADMIN = 1;
    const PERMISSION_NFC = 262144;
    const adminUrl = process.env.REACT_APP_ADMIN_URL;
    const apiUrl = process.env.REACT_APP_API_URL;

    const goToAdmin = () => {
        window.location.href = adminUrl;
    };

    useEffect(() => {
        WebApp.ready();
        WebApp.expand();
    }, []);


    if (loading) {
        return <div className="container">
            <div className="flex justify-center items-center min-h-screen text-white">Загрузка...</div>
        </div>;
    }

    if (accessDenied) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-red-700 text-white p-4 rounded-lg">
                <h2 className="text-2xl font-semibold">Отказано в доступе</h2>
                {blockReason && <p className="text-lg text-center mt-2">{blockReason}</p>}
                <button
                    onClick={() => alert("Функционал в процессе разработки")}
                    className="w-full max-w-md bg-blue-500 py-2 mt-5 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Техподдержка
                </button>
            </div>
        );
    }

    if (registrationAllowed) {
        return <RegisterForm apiUrl={apiUrl} onSuccess={() => window.location.reload()} />;
    }

    const handleNFC = async () => {
        if (!location) {
            if (!WebApp.LocationManager.isInited) {
                await new Promise((resolve) => {
                    WebApp.LocationManager.init(() => {
                        if (!WebApp.LocationManager.isInited) {
                            WebApp.showAlert("Невозможно получить локацию");
                            resolve(false);
                            return;
                        }
                        resolve(true);
                    });
                });
            }
            const newLocation = await getCurrentLocation();
            if (!newLocation) {
                WebApp.showAlert('Невозможно получить локацию');
                return;
            }
            setLocation(newLocation);
        }

        const queryParameters = {
            sessionID: sessionId,
            deviceId: deviceId,
            userId: user._id,
            location: location,
        };

        const urlParams = new URLSearchParams(queryParameters).toString();
        WebApp.openLink(`https://aura-tg.ru/nfc-scan?${urlParams}`, {
            try_browser: 'chrome',
            try_instant_view: false,
        });
    }

    const handleLocationError = (error) => {
        console.error(error);
        WebApp.showAlert(`Location Error: ${error}`);
    };

    const getCurrentLocation = () => {
        return new Promise((resolve) => {
            WebApp.LocationManager.getLocation((locationData) => {
                if (!locationData) {
                    handleLocationError('Невозможно получить локацию');
                    resolve(null);
                    return;
                }
                const locationString = `${locationData.latitude},${locationData.longitude}`;
                resolve(locationString);
            });
        });
    };

    const scanQR = async () => {
        try {
            // Initialize the location manager if not already inited.
            if (!WebApp.LocationManager.isInited) {
                await new Promise((resolve) => {
                    WebApp.LocationManager.init(() => {
                        if (!WebApp.LocationManager.isInited) {
                            WebApp.showAlert("Невозможно получить локацию");
                            resolve(false);
                            return;
                        }
                        resolve(true);
                    });
                });
            }

            // Get location data.
            const locationData = await getCurrentLocation();
            if (!locationData) {
                WebApp.showAlert('Невозможно получить локацию');
                return;
            }
            setLocation(locationData);
            // Show QR scanner popup.
            WebApp.showScanQrPopup(
                { text: 'Scan code' },
                async (qrData) => {
                    try {
                        // Close the QR scanner popup.
                        WebApp.closeScanQrPopup();

                        if (!qrData) {
                            WebApp.showAlert('Ошибка сканирования');
                            return;
                        }

                        // Prepare the scan data.
                        const scanData = {
                            qrData,
                            location: locationData,
                            userId: user._id,
                        };
                        console.log('Scan successful:', scanData);

                        // Send the data to your server.
                        const response = await fetch(`${apiUrl}/qr/scan`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(scanData),
                        });

                        const result = await response.json();
                        if (!response.ok) {
                            throw new Error(`Ошибка: ${result.message || "не определена"}`);
                        }

                        // Check the response from your endpoint.
                        if (result.status === 'success') {
                            setLoginSuccess(true);
                        } else if (result.status === 'device_not_found') {
                            // Save the scanned data for later use in registration.
                            setQrData(qrData);
                            setShowRegistration(true);
                            WebApp.showAlert('Рабочая станция не зарегистрирована');
                        } else if (result.status === 'access_denied') {
                            WebApp.showAlert('Отказано в доступе, у вас нет прав на данное рабочее место. Обратитесь к администратору.');
                            WebApp.closeScanQrPopup();
                        } else if (result.status === 'nfcMode_always' || result.status === 'nfcMode_geoMismatch') {
                            WebApp.closeScanQrPopup();
                            if (result.sessionId) {
                                setSessionId(result.sessionId);
                                setDeviceId(result.deviceId);
                            }
                            setShowNfc(true);
                        } else if (result.status === 'location_mismatch') {
                            WebApp.showAlert('Не совпадает геолокация АРМ. Отказано в доступе.');
                            WebApp.closeScanQrPopup();
                        } else {
                            WebApp.showAlert('Неожиданный ответ от сервера');
                        }
                    } catch (error) {
                        console.error('Error processing QR code:', error);
                        WebApp.showAlert(error.message);
                        WebApp.closeScanQrPopup();
                    }
                }
            );
        } catch (error) {
            console.error('Error in scanQR:', error);
            WebApp.showAlert('Ошибка сканирования');
            WebApp.closeScanQrPopup();
        }
    };

    const showOTP = () => {
        setShowOTPDisplay(true);
    };

    // Callback from RegisterDevice when registration is successful.
    const handleRegistrationSuccess = () => {
        setShowRegistration(false);
        setLoginSuccess(true);
    };

    // A general “back” handler to return to the main view.
    const handleBack = () => {
        setLoginSuccess(false);
        setShowRegistration(false);
        setShowOTPDisplay(false);
        setQrData(null);
    };

    return (
        <div className="container">
            {loginSuccess ? (
                <div className="flex justify-center items-center min-h-screen bg-gray-900 p-2">
                    <div className="w-full max-w-md bg-gray-800 text-white p-6 rounded-lg text-center">
                        <h2 className="text-xl font-semibold mb-4">Успешно авторизован. Нажмите "Войти" на экране Windows</h2>
                        <button
                            onClick={handleBack}
                            className="w-full bg-blue-500 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                            ◄ Назад
                        </button>
                    </div>
                </div>
            ) : showRegistration ? (
                <div className="registration-container">
                    <button className="back-button" onClick={handleBack}>
                        ◄ Назад
                    </button>
                    <RegisterDevice
                        qrData={qrData}
                        location={location}
                        apiUrl={apiUrl}
                        onRegistrationSuccess={handleRegistrationSuccess}
                    />
                </div>
            ) : showOTPDisplay ? (
                <div className="otp-container">
                    <button className="back-button" onClick={() => setShowOTPDisplay(false)}>
                        ◄ Назад
                    </button>
                    <OTPDisplay />
                </div>
            ) : showNfc ? (
                <div className="nfc-container">
                    <button className="back-button" onClick={() => setShowNfc(false)}>
                        ◄ Назад
                    </button>
                    <NfcButton
                        onClick={handleNFC}
                    />
                </div>
            ) : (
                <div className="button-container">
                    <button className="action-button qr-button" onClick={scanQR}>
                        <svg className="icon" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M2 2h8v8H2V2zm2 2v4h4V4H4zm-2 12h8v8H2v-8zm2 2v4h4v-4H4zm12-14h8v8h-8V2zm2 2v4h4V4h-4zm-2 12h8v8h-8v-8zm2 2v4h4v-4h-4z"
                            />
                        </svg>
                        <span>Сканирование QR</span>
                    </button>
                    <button className="action-button otp-button" onClick={showOTP}>
                        <svg className="icon" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                            />
                        </svg>
                        <span>Показать OTP</span>
                    </button>
                    <button className="action-button otp-button" onClick={() => alert("Функционал в процессе разработки")}>
                        <svg className="icon" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M20 2H4C2.9 2 2 2.9 2 4v14c0 1.1.9 2 2 2h4v4l4-4h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM4 16V4h16v12H11.17L8 19.17V16H4z"
                            />
                        </svg>
                        <span>Техподдержка</span>
                    </button>
                    {user && (user.permissions & PERMISSION_ADMIN) === PERMISSION_ADMIN && (
                        <button className="action-button admin-button" onClick={goToAdmin}>
                            <svg className="icon" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M3 3h18v18H3V3zm2 2v14h14V5H5zm7 2c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5zm0 2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                                />
                            </svg>
                            <span>Вход в админку</span>
                        </button>
                    )}
                    <button className="action-button otp-button" onClick={handleNFC}>
                        <svg className="icon" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M20.5,2h-17C2.67,2,2,2.67,2,3.5v17C2,21.33,2.67,22,3.5,22h17c0.83,0,1.5-0.67,1.5-1.5v-17C22,2.67,21.33,2,20.5,2z
                                    M10,19H6V5h4V19z M18,19h-4V5h4V19z"
                            />
                        </svg>
                        <span>NFC</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Home;