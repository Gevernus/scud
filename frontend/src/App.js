import './App.css';
import { useEffect, useState, useRef } from 'react';
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

  const handleLocationError = (error) => {
    console.error(error);
    WebApp.showAlert(`Location Error: ${error}`);
  };

  const initializeLocationManager = () => {
    return new Promise((resolve) => {
      if (WebApp.LocationManager.isInited) {
        resolve(true);
        return;
      }

      WebApp.LocationManager.init(() => {
        resolve(true);
      });
    });
  };

  const checkLocationSupport = () => {
    if (!WebApp.LocationManager.isLocationAvailable) {
      handleLocationError('Location services are not available');
      return false;
    }
    return true;
  };

  const handleLocationAccess = () => {
    return new Promise((resolve) => {
      if (WebApp.LocationManager.isAccessGranted) {
        resolve(true);
        return;
      }

      if (!WebApp.LocationManager.isAccessRequested) {
        WebApp.showConfirm(
          'Location access is required for this feature. Open settings?',
          (confirmed) => {
            if (confirmed) {
              console.log('trying to open settings')
              WebApp.LocationManager.openSettings();
            }
            resolve(false);
          }
        );
        return;
      }

      handleLocationError('Location access was previously denied');
      resolve(false);
    });
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      WebApp.LocationManager.getLocation((locationData) => {
        if (!locationData) {
          handleLocationError('Could not retrieve location');
          resolve(null);
          return;
        }

        resolve({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          altitude: locationData.altitude || null,
          accuracy: locationData.horizontal_accuracy || null,
          timestamp: Date.now()
        });
      });
    });
  };



  const scanQR = async () => {
    try {
      if (!WebApp.LocationManager.isInited) {
        WebApp.LocationManager.init(async () => {
          if (!WebApp.LocationManager.isInited) {
            console.error("Can't get locationg");
          }
          const locationData = await getCurrentLocation();
          if (!locationData) return;
          setLocation(locationData);
          WebApp.showScanQrPopup(
            { text: 'Scan code' },
            (qrData) => {
              if (!qrData) {
                WebApp.showAlert('Failed to scan QR code');
                return;
              }

              console.log('Scan successful:', {
                qrData,
                location: locationData,
                timestamp: new Date().toISOString()
              });
            }
          );
        });
      } else {
        const locationData = await getCurrentLocation();
        if (!locationData) return;
        setLocation(locationData);
        WebApp.showScanQrPopup(
          { text: 'Scan code' },
          (qrData) => {
            if (!qrData) {
              WebApp.showAlert('Failed to scan QR code');
              return;
            }

            console.log('Scan successful:', {
              qrData,
              location: locationData,
              timestamp: new Date().toISOString()
            });
          }
        );
      }
    } catch (error) {
      console.error(error);
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

const App = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;