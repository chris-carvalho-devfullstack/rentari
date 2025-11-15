// src/components/ui/Icon.tsx
'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import React from 'react';

interface IconProps {
  icon: IconProp;
  className?: string;
  spin?: boolean;
}

/**
 * Componente wrapper para ícones Font Awesome.
 */
export const Icon: React.FC<IconProps> = ({ icon, className = '', spin = false }) => {
  return (
    <FontAwesomeIcon icon={icon} className={className} spin={spin} />
  );
};