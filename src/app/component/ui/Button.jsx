import React from 'react';
import Link from 'next/link';

export const Button = ({
  children,
  href,
  onClick,
  variant = 'primary',
  className = '',
  target = '_self',
  rel = '',
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
  
  const variants = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500',
    ghost: 'text-gray-300 hover:text-white hover:bg-white/10',
    outline: 'border border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500',
  };

  const buttonClass = `${baseStyles} ${variants[variant] || variants.primary} ${className}`.trim();
  
  const content = (
    <>
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={buttonClass} target={target} rel={rel} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};

export const IconButton = ({ icon: Icon, className = '', ...props }) => (
  <Button
    variant="ghost"
    className={`p-2 rounded-full ${className}`}
    aria-label={props['aria-label'] || 'Icon button'}
    {...props}
  >
    <Icon className="w-5 h-5" />
  </Button>
);

export const GitHubButton = ({ className = '', ...props }) => (
  <IconButton
    as="a"
    href="https://github.com/aparnap2"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="GitHub"
    icon={GitHubIcon}
    className={className}
    {...props}
  />
);

const GitHubIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);
