const NfcButton = ({ onClick }) => {
    return (
        
        <button className="action-button nfc-button" onClick={onClick}>
            <svg className="icon" viewBox="0 0 24 24">
                <path
                    fill="currentColor"
                    d="M20.5,2h-17C2.67,2,2,2.67,2,3.5v17C2,21.33,2.67,22,3.5,22h17c0.83,0,1.5-0.67,1.5-1.5v-17C22,2.67,21.33,2,20.5,2z
        M10,19H6V5h4V19z M18,19h-4V5h4V19z"
                />
            </svg>
            <span>Подтвердитe геопозицию с помощью NFC</span>
        </button>

    );
};

export default NfcButton;
