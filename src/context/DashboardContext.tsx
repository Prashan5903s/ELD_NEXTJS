"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardState {
    showMenu: boolean;
    setShowMenu: (state: boolean) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
    return context;
};

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [showMenu, setShowMenu] = useState<boolean>(false);

    return (
        <DashboardContext.Provider value={{ showMenu, setShowMenu }}>
            {children}
        </DashboardContext.Provider>
    );
};
