import { useState, useEffect } from 'react';

const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    // Set initial values
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    // Convenience methods
    getCardSize: () => isMobile ? 'small' : 'default',
    getButtonSize: () => isMobile ? 'middle' : 'large',
    getTableSize: () => isMobile ? 'small' : 'middle',
    getModalWidth: () => isMobile ? '95vw' : 600,
    getProgressSize: () => isMobile ? 80 : 120,
    getFontSize: (desktop = '24px', mobile = '18px') => isMobile ? mobile : desktop,
  };
};

export default useResponsive;