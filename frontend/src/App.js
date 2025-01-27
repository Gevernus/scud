import './App.css';
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import OTPDisplay from './components/OTPDisplay';
import { UserProvider, useUser } from './context/UserContext';

const AppContent = () => {
  const [showOTPDisplay, setShowOTPDisplay] = useState(false);
  const [location, setLocation] = useState(null);
  const { loading: isUserLoading } = useUser();

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
  }, []);

  // const scanQR = () => {
  //   try {
  //     WebApp.requestLocation((locationResult) => {
  //       if (locationResult) {
  //         setLocation(locationResult);

  //         // Then show QR scanner
  //         WebApp.showScanQrPopup({ text: 'Scan code' }, (qrData) => {
  //           console.log('Scanned:', qrData);
  //           console.log('Location:', locationResult);
  //         });
  //       }
  //     });
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const MAX_RETRIES = 2;
  let locationRetryCount = 0;

  const handleLocationError = (error) => {
    console.error(error);
    WebApp.showAlert(`Location Error: ${error}`);
  };

  const initializeLocationManager = () => {
    return new Promise((resolve) => {
      console.log('Trying to init LocationManager');
      WebApp.LocationManager.init((isInitialized) => {
        console.log(isInitialized);
        if (!isInitialized) {
          handleLocationError('Failed to initialize location manager');
          resolve(false);
        }
        resolve(true);
      });
    });
  };

  const checkLocationAvailability = () => {
    console.log(WebApp.LocationManager);
    if (!WebApp.LocationManager.isLocationAvailable) {
      handleLocationError('Location services are not available on this device');
      return false;
    }
    return true;
  };

  const handleLocationAccess = async () => {
    if (!WebApp.LocationManager.isAccessGranted) {
      WebApp.showConfirm(
        'Location access is required. Open settings?',
        (confirmed) => {
          if (confirmed) {
            WebApp.LocationManager.openSettings();
            // You might want to add a way to check again after returning
          }
        }
      );
      return false;
    }
    return true;
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      WebApp.LocationManager.getLocation((locationData) => {
        if (!locationData) {
          if (locationRetryCount < MAX_RETRIES) {
            locationRetryCount++;
            WebApp.showAlert('Retrying location detection...');
            setTimeout(() => getCurrentLocation().then(resolve), 1000);
            return;
          }
          handleLocationError('Could not retrieve location after retries');
          resolve(null);
        }
        locationRetryCount = 0; // Reset retry counter on success
        resolve(locationData);
      });
    });
  };

  const scanQR = async () => {
    try {
      // 1. Initialize LocationManager
      const isInitialized = await initializeLocationManager();
      if (!isInitialized) return;

      // 2. Check device capabilities
      if (!checkLocationAvailability()) return;

      // 3. Handle permissions
      const hasAccess = await handleLocationAccess();
      if (!hasAccess) return;

      // 4. Get location with retry logic
      const locationData = await getCurrentLocation();
      if (!locationData) return;

      // 5. Store location
      setLocation(locationData);

      // 6. Show QR Scanner
      WebApp.showScanQrPopup(
        { text: 'Scan code' },
        (qrData) => {
          if (!qrData) {
            WebApp.showAlert('QR Scan failed');
            return;
          }

          console.log('Successful scan:', {
            qrData,
            location: locationData
          });

          // Process QR data with location here
        }
      );

    } catch (error) {
      handleLocationError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showOTP = () => {
    setShowOTPDisplay(true);
  };

  return (
    <div className="container">
      {!showOTPDisplay ? (
        <div className="button-container">
          <button
            className="action-button qr-button"
            onClick={scanQR}
          >
            <svg className="icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M2 2h8v8H2V2zm2 2v4h4V4H4zm-2 12h8v8H2v-8zm2 2v4h4v-4H4zm12-14h8v8h-8V2zm2 2v4h4V4h-4zm-2 12h8v8h-8v-8zm2 2v4h4v-4h-4z" />
            </svg>
            <span>Scan QR</span>
          </button>

          <button
            className="action-button otp-button"
            onClick={showOTP}
          >
            <svg className="icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            <span>Show OTP</span>
          </button>
        </div>
      ) : (
        <div className="otp-container">
          <button
            className="back-button"
            onClick={() => setShowOTPDisplay(false)}
          >
            ◄ Back
          </button>
          <OTPDisplay />
        </div>
      )}
    </div>
  );
};

// Main App component that wraps everything with UserProvider
const App = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;