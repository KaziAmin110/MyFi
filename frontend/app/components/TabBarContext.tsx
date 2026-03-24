import React, { createContext, useContext, useState } from "react";

type TabBarContextType = {
  visible: boolean;
  setVisible: (v: boolean) => void;
};

const TabBarContext = createContext<TabBarContextType>({
  visible: true,
  setVisible: () => {},
});

export const TabBarProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(true);
  return (
    <TabBarContext.Provider value={{ visible, setVisible }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => useContext(TabBarContext);
