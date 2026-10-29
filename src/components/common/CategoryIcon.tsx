import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Home,
  FileText,
  HeartPulse,
  GraduationCap,
  Plane,
  Briefcase,
  TrendingUp,
  Gift,
  HelpCircle,
  Tag,
  Coffee,
  Smartphone,
  Wifi,
  Zap,
  Shield,
  CreditCard,
  DollarSign,
  PiggyBank,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Home,
  FileText,
  HeartPulse,
  GraduationCap,
  Plane,
  Briefcase,
  TrendingUp,
  Gift,
  Tag,
  Coffee,
  Smartphone,
  Wifi,
  Zap,
  Shield,
  CreditCard,
  DollarSign,
  PiggyBank,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', color }) => {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
