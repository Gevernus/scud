import React from 'react';

const NFCScanner = () => {
    const handleScan = async () => {
        if ('NDEFReader' in window) {
            const ndef = new window.NDEFReader();
            try {
                // Start scanning on button click.
                await ndef.scan();
                console.log("NFC scan started successfully.");

                ndef.onreading = (event) => {
                    let message = '';
                    // Process each record in the NFC message.
                    for (const record of event.message.records) {
                        const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                        message += textDecoder.decode(record.data);
                    }
                    // Show an alert with the read NFC data.
                    alert(`Считанные данные: ${message}`);
                };
            } catch (err) {
                alert(`Ошибка запуска NFC: ${err}`);
            }
        } else {
            alert("Web NFC не поддерживается в этом браузере.");
        }
    };

    return (
        <div>
            <h1>NFC Scanner</h1>
            <button onClick={handleScan} className="action-button qr-button">
                <svg className="icon" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M20.5,2h-17C2.67,2,2,2.67,2,3.5v17C2,21.33,2.67,22,3.5,22h17c0.83,0,1.5-0.67,1.5-1.5v-17C22,2.67,21.33,2,20.5,2z M10,19H6V5h4V19z M18,19h-4V5h4V19z"
                    />
                </svg>
                <span>Сканировать NFC</span>
            </button>
        </div>
    );
};

export default NFCScanner;
