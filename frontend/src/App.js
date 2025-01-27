import './App.css';

function App() {
  // Telegram WebApp initialization
  useEffect(() => {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }, []);

  // Native QR scanner
  const scanQR = () => {
    window.Telegram.WebApp.showScanQrPopup({ text: 'Scan code' }, (data) => {
      console.log('Scanned:', data);
    });
  };

  return (
    <div>
      <button onClick={scanQR}>Scan QR</button>
    </div>
  );
}

export default App;
