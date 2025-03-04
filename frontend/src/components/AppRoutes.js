import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home'; // your home page
import NFCScanner from './NFCScanner'; // your NFC scan page

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nfc-scan" element={<NFCScanner />} />
        </Routes>
    );
};

export default AppRoutes;