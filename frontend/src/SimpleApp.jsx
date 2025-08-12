function SimpleApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: '#0f0f0f',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <h1>🚀 Trading Metrics App</h1>
      <p>✅ React app is working!</p>
      <p>📱 Responsive design ready</p>
      <div style={{ 
        background: '#2d2d2d', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Status</h2>
        <ul>
          <li>✅ Frontend server running</li>
          <li>✅ React components loaded</li>
          <li>✅ Responsive CSS applied</li>
        </ul>
      </div>
    </div>
  );
}

export default SimpleApp;