/**
 * Centralized Brand Theme Configuration for Agri ERP Vendor Portal
 * Strictly adheres to the mandated 3-color teal palette and supporting neutrals.
 */
export const BRAND_THEME = {
  colors: {
    primary: '#0F766E',
    primaryDark: '#115E59',
    secondary: '#14B8A6',
    light: '#CCFBF1',
    lightHover: '#99F6E4',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    secondaryText: '#64748B',
    border: '#E2E8F0',
    error: '#DC2626',
    warning: '#D97706',
    success: '#16A34A',
  },
  chartPalette: [
    '#0F766E', // Primary Teal
    '#14B8A6', // Secondary Teal
    '#0D9488', // Deep Teal
    '#2DD4BF', // Bright Teal
    '#5EEAD4', // Soft Teal
    '#115E59', // Dark Slate Teal
    '#99F6E4', // Mint Light Teal
    '#CCFBF1', // Brand Light Teal
  ],
  statusStyles: {
    Active: 'bg-brand-success-light text-brand-success border-brand-success/20',
    Inactive: 'bg-brand-background text-brand-muted border-brand-border',
    Confirmed: 'bg-brand-light text-brand-primary border-brand-secondary/30',
    Verified: 'bg-brand-success-light text-brand-success border-brand-success/20',
    Completed: 'bg-brand-success-light text-brand-success border-brand-success/20',
    Delivered: 'bg-brand-light text-brand-primary border-brand-secondary/30',
    Shipped: 'bg-brand-light text-brand-primary border-brand-secondary/30',
    Packed: 'bg-brand-light text-brand-primary border-brand-secondary/30',
    Processing: 'bg-brand-warning-light text-brand-warning border-brand-warning/20',
    New: 'bg-brand-light text-brand-primary border-brand-secondary/30',
    Pending: 'bg-brand-warning-light text-brand-warning border-brand-warning/20',
    Sent: 'bg-brand-light text-brand-primary border-brand-secondary/30',
    'Not Sent': 'bg-brand-background text-brand-muted border-brand-border',
    Draft: 'bg-brand-background text-brand-muted border-brand-border',
    Expired: 'bg-brand-error-light text-brand-error border-brand-error/20',
    Failed: 'bg-brand-error-light text-brand-error border-brand-error/20',
    Rejected: 'bg-brand-error-light text-brand-error border-brand-error/20',
    Cancelled: 'bg-brand-error-light text-brand-error border-brand-error/20',
    'Low Stock': 'bg-brand-warning-light text-brand-warning border-brand-warning/20',
    'In Stock': 'bg-brand-success-light text-brand-success border-brand-success/20',
    'Out of Stock': 'bg-brand-error-light text-brand-error border-brand-error/20',
    Exhausted: 'bg-brand-background text-brand-muted border-brand-border',
    Paid: 'bg-brand-success-light text-brand-success border-brand-success/20',
    Partial: 'bg-brand-warning-light text-brand-warning border-brand-warning/20',
    'Partially Paid': 'bg-brand-warning-light text-brand-warning border-brand-warning/20',
    Unpaid: 'bg-brand-error-light text-brand-error border-brand-error/20',
    Overdue: 'bg-brand-error-light text-brand-error border-brand-error/20',
    High: 'bg-brand-error-light text-brand-error border-brand-error/20',
    Medium: 'bg-brand-warning-light text-brand-warning border-brand-warning/20',
    Low: 'bg-brand-light text-brand-primary border-brand-secondary/30',
  },
};

export default BRAND_THEME;

