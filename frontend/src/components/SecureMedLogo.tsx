import React from 'react';
import { MedNexusLogo } from './MedNexusLogo';

// Backward compatibility wrapper for SecureMedLogo
export const SecureMedLogo: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}> = (props) => {
  return <MedNexusLogo {...props} />;
};

export default SecureMedLogo;
