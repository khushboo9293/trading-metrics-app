import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Typography, Drawer } from 'antd';
import { DashboardOutlined, PlusOutlined, UnorderedListOutlined, BarChartOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Content } = AntLayout;
const { Title } = Typography;

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: '/add-trade',
      icon: <PlusOutlined />,
      label: <Link to="/add-trade">Add Trade</Link>,
    },
    {
      key: '/trades',
      icon: <UnorderedListOutlined />,
      label: <Link to="/trades">Trade Logs</Link>,
    },
    {
      key: '/insights',
      icon: <BarChartOutlined />,
      label: <Link to="/insights">Insights</Link>,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '0 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ 
            color: '#ff006b', 
            margin: 0, 
            fontSize: isMobile ? '18px' : '24px'
          }}>
            {isMobile ? 'TM' : 'Trading Metrics'}
          </Title>
          
          {!isMobile && (
            <div style={{ marginLeft: '32px' }}>
              <Menu
                mode="horizontal"
                selectedKeys={[location.pathname]}
                items={menuItems}
                style={{ border: 'none', backgroundColor: 'transparent' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuVisible(true)}
            />
          )}
          
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            size={isMobile ? 'small' : 'default'}
          >
            {isMobile ? '' : 'Logout'}
          </Button>
        </div>
      </Header>

      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={280}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={() => setMobileMenuVisible(false)}
          style={{ border: 'none', backgroundColor: 'transparent' }}
        />
      </Drawer>

      <Content style={{ 
        padding: isMobile ? '16px 12px' : '24px 50px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          width: '100%'
        }}>
          <Outlet />
        </div>
      </Content>
    </AntLayout>
  );
};

export default Layout;