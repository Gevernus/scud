import React, { useEffect, useState } from 'react';

const NFCScanner = () => {
    const [sessionId, setSessionId] = useState(null);
    const [nfcName, setNfcName] = useState('');
    const [nfcDescription, setNfcDescription] = useState('');
    const [userId, setUserId] = useState(null);
    const [location, setLocation] = useState(null);
    const [status, setStatus] = useState('');
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setSessionId(params.get('sessionID'));
        setUserId(params.get('userId'));
        setLocation(params.get('location'));
    }, []);

    const sendToServer = async (tagId) => {
        try {
            const payload = { tagId, sessionId, nfcName, nfcDescription, userId, location };
            const jsonPayload = JSON.stringify(payload, (key, value) =>
                value === null || value === 'null' ? undefined : value
            );
            const response = await fetch(`https://aura-tg.ru/api/nfc-handler`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-telegram-id': window.Telegram.WebApp.initDataUnsafe?.user?.id,
                },
                body: jsonPayload
            });
            const data = await response.json();
            setStatus(data.status);
            alert(data.message || `❌ Ошибка: ${data.error}`);
        } catch (error) {
            alert(`Ошибка сети: ${error}`);
        }
    };

    const generateGUID = () => {
        // Generates a RFC4122 version 4 compliant GUID.
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const handleWriteOrRead = async () => {
        if ('NDEFReader' in window) {
            const ndef = new window.NDEFReader();
            const abortController = new AbortController(); // Create an AbortController.
            let ignoreRead = false;

            ndef.onreading = async (event) => {
                if (ignoreRead) return;

                let message = '';
                // Process each record in the NFC message.
                for (const record of event.message.records) {
                    const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                    message += textDecoder.decode(record.data);
                }

                if (message.trim() === '') {
                    // If the tag is empty, generate a GUID and write it.
                    const guid = generateGUID();
                    ignoreRead = true; // Prevent handling the subsequent read event triggered by the write.
                    try {
                        await ndef.write(guid);
                        // alert(`GUID записан: ${guid}`);
                        sendToServer(guid);
                    } catch (err) {
                        alert(`Ошибка записи NFC: ${err}`);
                    } finally {
                        ignoreRead = false;
                        abortController.abort(); // Stop scanning after write.
                    }
                } else {
                    // If the tag has data, show it.
                    // alert(`Считанные данные: ${message}`);
                    sendToServer(message);
                    abortController.abort(); // Stop scanning after read.
                }
            };

            try {
                // Start scanning with the AbortController's signal.
                await ndef.scan({ signal: abortController.signal });
                setShowLabel(true);
                console.log("NFC scan started.");
            } catch (err) {
                alert(`Ошибка запуска NFC: ${err}`);
            }
        } else {
            alert("Web NFC не поддерживается в этом браузере.");
        }
    };

    return (
        <div className="container">
            <div className="button-container">
                {status === 'NFC not found' && (
                    <input
                        type="text"
                        placeholder="Введите имя NFC-метки"
                        value={nfcName}
                        onChange={(e) => setNfcName(e.target.value)}
                        className='p-2 border border-gray-600 rounded-md text-black'
                        required
                    />
                )}
                {status === 'NFC not found' && (
                    <input
                        type="text"
                        placeholder="Введите описание NFC-метки"
                        value={nfcDescription}
                        onChange={(e) => setNfcDescription(e.target.value)}
                        className='p-2 border border-gray-600 rounded-md text-black'
                        required
                    />
                )}
                {showLabel ? (
                    <button onClick={handleWriteOrRead} className="action-button qr-button">
                        <svg className="icon" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M20.5,2h-17C2.67,2,2,2.67,2,3.5v17C2,21.33,2.67,22,3.5,22h17c0.83,0,1.5-0.67,1.5-1.5v-17C22,2.67,21.33,2,20.5,2z M10,19H6V5h4V19z M18,19h-4V5h4V19z"
                            />
                        </svg>
                        <span>{status === 'NFC not found' ? 'Добавить метку' : 'Сканировать NFC'}</span>
                    </button>
                ) : (
                    <div className="text-center mb-8">
                        <p className="text-gray-400">Поднесите телефон к NFC метке</p>
                    </div>
                )}

            </div>
        </div>

    );
};

export default NFCScanner;
