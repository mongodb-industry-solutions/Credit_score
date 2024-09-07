// components/Layout.js

import React, { useState } from 'react';
import Icon from '@leafygreen-ui/icon';

const Layout = ({ sidebar, mainContent }) => {
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', minHeight: '100vh', maxWidth: '100vw' }}>
      <div style={{ flex: '0 0 200px', display: isSidebarVisible ? 'block' : 'none' }}>
        {sidebar}
      </div>
      <button
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          top: '70px',
          left: isSidebarVisible ? '400px' : '25px',
          zIndex: 0,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        {isSidebarVisible ? <Icon glyph="ChevronLeft" /> : <Icon glyph="ChevronRight" />}
      </button>

      <div style={{ flex: '1', padding: '20px', marginLeft: isSidebarVisible ? '220px' : '50px',  marginTop: '1%', whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
        {mainContent}
      </div>
    </div>
  );
};

export default Layout;
