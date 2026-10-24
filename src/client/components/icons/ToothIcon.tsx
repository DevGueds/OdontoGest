import React from 'react';

export interface ToothIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Dedicated clinical dental tooth vector icon aligned with Lucide React conventions.
 * 24x24 viewBox, stroke-width 2, round linecaps and linejoins.
 */
export const ToothIcon: React.FC<ToothIconProps> = ({
  size = 24,
  className = '',
  strokeWidth = 2,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Anatomical crown and roots outline */}
      <path d="M7 3C4.24 3 2 5.24 2 8c0 3.3 1.45 6.75 3 10 .8 1.75 2.1 3 4 3 1.5 0 2.5-1.1 3-2.6.5 1.5 1.5 2.6 3 2.6 1.9 0 3.2-1.25 4-3 1.55-3.25 3-6.7 3-10 0-2.76-2.24-5-5-5-2.2 0-3.5 1.2-5 2.5C10.5 4.2 9.2 3 7 3z" />
      {/* Occlusal surface groove highlight */}
      <path d="M9.5 8.5c1 1.2 4 1.2 5 0" />
    </svg>
  );
};

export default ToothIcon;
