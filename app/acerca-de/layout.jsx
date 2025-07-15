import React from "react";
import AnimatedBackground from "../../components/shared/AnimatedBackground";

const Layout = ({ children }) => {
  return (
    <div className="relative max-w-full overflow-hidden sm:overflow-visible min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Layout;
