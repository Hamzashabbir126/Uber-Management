import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";
import CaptainSignup from "./pages/CaptainSignup";
import Captainlogin from "./pages/Captainlogin";
import CaptainHome from "./pages/CaptainHome";
import Start from "./pages/Start";
import UserProtectWrapper from "./pages/UserProtectWrapper";
import CaptainProtectWrapper from "./pages/CaptainProtectWrapper";
import ErrorBoundary from "./components/ErrorBoundary";
import UserLogout from "./pages/UserLogout";
import CaptainLogout from "./pages/CaptainLogout";
import ConfirmRideDetails from "./components/ConfirmRideDetails";
import CaptainWaiting from "./pages/CaptainWaiting";
import RideInProgress from "./pages/RideInProgress";
import RateRide from "./pages/RateRide";
import ActiveRide from "./pages/ActiveRide";
import RideCompleted from "./pages/RideCompleted";
import WaitingForDriver from "./components/WaitingForDriver";
import SmartNavigation from "./components/SmartNavigation";
import Header from "./components/Header";
import { SocketContext } from "./context/SocketContext";
import { useState, useEffect } from "react";

function App() {
  // Create a simpler socket context for non-authenticated routes
  const [simpleSocket, setSimpleSocket] = useState(null);

  useEffect(() => {
    // Global listener for ride completed events
    const handleGlobalRideCompleted = (event) => {
      console.log('[App] Global ride completed event received:', event.detail);
      
      // Store the ride data in localStorage for recovery
      try {
        localStorage.setItem('lastCompletedRide', JSON.stringify(event.detail.ride || {}));
      } catch (e) {
        console.error('Error storing ride data:', e);
      }
    };
    
    // Add event listener
    window.addEventListener('globalRideCompleted', handleGlobalRideCompleted);
    
    // Clean up
    return () => {
      window.removeEventListener('globalRideCompleted', handleGlobalRideCompleted);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="App">
        <Header />
        <SmartNavigation>
          <Routes>
            {/* Public routes without socket connection */}
            <Route path="/" element={<UserLogin />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/signup" element={<UserSignup />} />
            <Route path="/captain-signup" element={<CaptainSignup />} />
            <Route path="/captain-login" element={<Captainlogin />} />
            <Route path="/start" element={<Start />} />
            <Route path="/user-logout" element={<UserLogout />} />
            <Route path="/captain-logout" element={<CaptainLogout />} />

            {/* Protected routes with socket connection */}
            <Route
              path="/home"
              element={
                <UserProtectWrapper>
                  <Home />
                </UserProtectWrapper>
              }
            />
            <Route
              path="/captain-home"
              element={
                <CaptainProtectWrapper>
                  <CaptainHome />
                </CaptainProtectWrapper>
              }
            />
            <Route
              path="/confirm-ride-details"
              element={
                <CaptainProtectWrapper>
                  <ConfirmRideDetails />
                </CaptainProtectWrapper>
              }
            />
            <Route
              path="/captain-waiting"
              element={
                <CaptainProtectWrapper>
                  <CaptainWaiting />
                </CaptainProtectWrapper>
              }
            />
            <Route path="/ride-in-progress" element={<RideInProgress />} />
            <Route
              path="/ride-complete"
              element={
                <UserProtectWrapper>
                  <RateRide />
                </UserProtectWrapper>
              }
            />
            <Route
              path="/active-ride"
              element={
                <UserProtectWrapper>
                  <ActiveRide />
                </UserProtectWrapper>
              }
            />
            <Route
              path="/ride-completed"
              element={
                <UserProtectWrapper>
                  <RideCompleted />
                </UserProtectWrapper>
              }
            />
            <Route
              path="/waiting-for-driver"
              element={
                <UserProtectWrapper>
                  <WaitingForDriver />
                </UserProtectWrapper>
              }
            />
          </Routes>
        </SmartNavigation>
      </div>
    </ErrorBoundary>
  );
}

export default App;
