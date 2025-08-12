import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TradeLogs from './pages/TradeLogs';
import AddTrade from './pages/AddTrade';
import EditTrade from './pages/EditTrade';
import Insights from './pages/Insights';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          // Whoop-inspired color palette
          colorPrimary: '#ff006b',
          borderRadius: 12,
          
          // Dark backgrounds - Whoop style
          colorBgBase: '#1a1a1a',
          colorBgContainer: '#2d2d2d',
          colorBgElevated: '#363636',
          colorBgLayout: '#0f0f0f',
          
          // Subtle borders
          colorBorder: '#3a3a3a',
          colorBorderSecondary: '#2a2a2a',
          
          // High contrast text
          colorText: '#ffffff',
          colorTextSecondary: '#cccccc',
          colorTextTertiary: '#999999',
          colorTextQuaternary: '#666666',
          
          // Vibrant accent colors - Whoop style
          colorSuccess: '#00ff88',    // Bright green
          colorWarning: '#ffaa00',    // Bright orange
          colorError: '#ff4757',      // Bright red
          colorInfo: '#00d9ff',       // Bright cyan
          
          // Typography - responsive sizes
          fontSize: 14,
          fontSizeHeading1: 28, // Reduced for mobile
          fontSizeHeading2: 22, // Reduced for mobile
          fontSizeHeading3: 18, // Reduced for mobile
          
          // Responsive spacing
          marginLG: 20, // Reduced for mobile
          marginMD: 12, // Reduced for mobile
          paddingLG: 20, // Reduced for mobile
          paddingMD: 12, // Reduced for mobile
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trades" element={<TradeLogs />} />
                <Route path="/add-trade" element={<AddTrade />} />
                <Route path="/edit-trade/:id" element={<EditTrade />} />
                <Route path="/insights" element={<Insights />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;