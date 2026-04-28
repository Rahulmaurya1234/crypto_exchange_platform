import React from 'react';

interface TabProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

interface TabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ id, label, icon, onClick, active }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, children }) => {
  return <div>{children}</div>;
};

export const TabContent: React.FC<{ id: string; active: boolean; children: React.ReactNode }> = ({ active, children }) => {
  if (!active) return null;
  return <>{children}</>;
};
