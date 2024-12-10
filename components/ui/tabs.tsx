import React, { createContext, useContext, useState, ReactNode, ReactElement, useEffect } from 'react';
import clsx from 'clsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TabsContextProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  disabled: boolean;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

function useTabsContext(): TabsContextProps {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a <Tabs> parent.');
  }
  return context;
}

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  className?: string;
  children: ReactNode;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function Tabs({ defaultValue, value, className, children, onValueChange, disabled = false }: TabsProps): ReactElement {
  const [activeTab, setActiveTab] = useState(value || defaultValue || '');

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setActiveTab(value);
    }
  }, [value]);

  const handleTabChange = (newValue: string) => {
    if (disabled) return;
    if (value === undefined) {
      setActiveTab(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange, disabled }}>
      <div className={clsx('tabs', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: ReactNode;
}

export function TabsList({ className, children }: TabsListProps): ReactElement {
  const { disabled } = useTabsContext();
  return (
    <div
      className={clsx(
        'tabs-list flex border-b border-gray-100 gap-4',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps): ReactElement {
  const { activeTab, setActiveTab, disabled } = useTabsContext();
  const isActive = activeTab === value;

  const trigger = (
    <button
      onClick={() => setActiveTab(value)}
      className={clsx(
        'tabs-trigger px-4 py-2 text-sm font-medium transition-colors rounded-t-md',
        isActive ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-600 hover:text-blue-600',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tab-content-${value}`}
      disabled={disabled}
    >
      {children}
    </button>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>
            <p>Tab navigation is disabled during processing</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return trigger;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps): ReactElement | null {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div
      id={`tab-content-${value}`}
      role="tabpanel"
      className={clsx('tabs-content p-4 bg-white rounded-lg shadow-md border border-gray-100', className)}
    >
      {children}
    </div>
  );
}

