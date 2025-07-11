import React from "react";

const Layout = ({ children }) => {
  return (
    <div className="max-w-full overflow-hidden sm:overflow-visible">
    {children}
    </div>
  );
};

export default Layout;