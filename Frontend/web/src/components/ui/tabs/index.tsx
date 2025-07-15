import { ReactNode, Children, cloneElement, isValidElement } from 'react';

interface TabsProps {
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface TabProps {
  value: string;
  label?: string;
  children?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Tabs = ({ children, value, onChange, className = '' }: TabsProps) => {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {Children.map(children, (child) => {
        if (isValidElement<TabProps>(child)) {
          return cloneElement<TabProps>(child, {
            active: child.props.value === value,
            onClick: () => onChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
};

export const Tab = ({ 
  children, 
  value, 
  label, 
  active = false, 
  onClick, 
  className = '' 
}: TabProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-b-2 border-blue-500 text-blue-600'
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } ${className}`}
    >
      {label || children}
    </button>
  );
};