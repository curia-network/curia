'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface WhatsNewContextType {
  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
}

const WhatsNewContext = createContext<WhatsNewContextType | undefined>(undefined);

export function WhatsNewProvider({ children }: { children: React.ReactNode }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const openNotifications = useCallback(() => {
    setIsNotificationsOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  return (
    <WhatsNewContext.Provider
      value={{
        isNotificationsOpen,
        openNotifications,
        closeNotifications,
      }}
    >
      {children}
    </WhatsNewContext.Provider>
  );
}

export function useWhatsNew() {
  const context = useContext(WhatsNewContext);
  if (context === undefined) {
    throw new Error('useWhatsNew must be used within a WhatsNewProvider');
  }
  return context;
}