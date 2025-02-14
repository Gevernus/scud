import './App.css';
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import OTPDisplay from './components/OTPDisplay';
import RegisterDevice from './components/RegisterDevice';
import { UserProvider, useUser } from './context/UserContext';

const AppContent = () => {
  // State for different UI screens
  const [showOTPDisplay, setShowOTPDisplay] = useState(false);
  const [location, setLocation] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  // We store the scanned data in case the device needs registration.
  const [qrData, setQrData] = useState(null);
  const { user } = useUser();

  const PERMISSION_ADMIN = 1;
  const adminUrl = process.env.REACT_APP_ADMIN_URL;
  const apiUrl = process.env.REACT_APP_API_URL;

  const goToAdmin = () => {
    window.location.href = adminUrl;
  };

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
  }, []);

  const handleLocationError = (error) => {
    console.error(error);
    WebApp.showAlert(`Location Error: ${error}`);
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      WebApp.LocationManager.getLocation((locationData) => {
        if (!locationData) {
          handleLocationError('Could not retrieve location');
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
              WebApp.showAlert("Can't get location");
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
        WebApp.showAlert('Unable to get location');
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
              WebApp.showAlert('Failed to scan QR code');
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

            if (!response.ok) {
              throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();

            // Check the response from your endpoint.
            if (result.status === 'success') {
              setLoginSuccess(true);
            } else if (result.status === 'device_not_found') {
              // Save the scanned data for later use in registration.
              setQrData(qrData);
              setShowRegistration(true);
              WebApp.showAlert('Device not registered. Please register your device.');
            } else {
              WebApp.showAlert('Unexpected response from server');
            }
          } catch (error) {
            console.error('Error processing QR code:', error);
            WebApp.showAlert('Error processing QR code');
            WebApp.closeScanQrPopup();
          }
        }
      );
    } catch (error) {
      console.error('Error in scanQR:', error);
      WebApp.showAlert('An error occurred while scanning');
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
            <h2 className="text-xl font-semibold mb-4">Login Successful</h2>
            <button
              onClick={handleBack}
              className="w-full bg-blue-500 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      ) : showRegistration ? (
        <div className="registration-container">
          <button className="back-button" onClick={handleBack}>
            Back
          </button>
          <RegisterDevice
            qrData={qrData}
            apiUrl={apiUrl}
            onRegistrationSuccess={handleRegistrationSuccess}
          />
        </div>
      ) : showOTPDisplay ? (
        <div className="otp-container">
          <button className="back-button" onClick={() => setShowOTPDisplay(false)}>
            ◄ Back
          </button>
          <OTPDisplay />
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
            <span>Scan QR</span>
          </button>

          <button className="action-button otp-button" onClick={showOTP}>
            <svg className="icon" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
              />
            </svg>
            <span>Show OTP</span>
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
