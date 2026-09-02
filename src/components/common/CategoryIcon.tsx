import React from 'react';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
  className?: string;
  fallback?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  fallback = 'CircleDollarSign',
  ...props
}) => {
  // Try to find the icon by exact name or capitalized name
  const iconKey = (name in Icons
    ? name
    : Object.keys(Icons).find((k) => k.toLowerCase() === name.toLowerCase()) ||
      fallback) as keyof typeof Icons;

  const IconComponent = (Icons[iconKey] as React.ComponentType<LucideProps>) || Icons.CircleDollarSign;

  return <IconComponent className={className} {...props} />;
};

export const AVAILABLE_ICONS = [
  'Cookie',
  'Utensils',
  'ShoppingBag',
  'Coffee',
  'Home',
  'Zap',
  'Car',
  'Tv',
  'Tag',
  'HeartPulse',
  'Banknote',
  'Laptop',
  'TrendingUp',
  'ShieldCheck',
  'Plane',
  'Gift',
  'GraduationCap',
  'Smartphone',
  'Film',
  'Fuel',
  'Music',
  'Wifi',
  'Dumbbell',
  'Smile',
  'Package',
  'Wine',
  'Baby',
  'Scissors',
  'Briefcase',
  'CreditCard',
  'PiggyBank',
  'Sparkles',
];

export const PRESET_COLORS = [
  '#F59E0B', // Amber / Orange
  '#10B981', // Emerald / Green
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#14B8A6', // Teal
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#64748B', // Slate
];
