import type { SVGProps } from 'react';

export function CustomHomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 2.09961L2 11.0996V22H8V15H16V22H22V11.0996L12 2.09961Z"
      />
    </svg>
  );
}
