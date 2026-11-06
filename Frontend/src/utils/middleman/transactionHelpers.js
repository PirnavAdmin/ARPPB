/**
 * Helper utilities for generating realistic transaction records and identifiers
 */

export const generateId = (prefix = 'TXN') => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

export const CROP_LIST = [
  'Paddy',
  'Wheat',
  'Maize',
  'Groundnut',
  'Cotton',
  'Chilli',
];

export const CROP_VARIETIES = {
  Paddy: ['BPT 5204 (Samba Mahsuri)', 'MTU 1010', 'RNR 15048 (Telangana Sona)', 'Basmati 1509'],
  Wheat: ['Sharbati', 'Lokwan', 'GW-322', 'Kalyansona'],
  Maize: ['DHM 117', 'Pioneer 3396', 'Kaveri 50', 'Hybrid Yellow'],
  Groundnut: ['Kadiri 6', 'TMV 2', 'TAG 24', 'JL 24'],
  Cotton: ['Bunny Bt', 'RCH 2', 'Brahma', 'DCH 32'],
  Chilli: ['Teja (S17)', 'Byadgi', 'Guntur Sannam (S4)', 'Armoor'],
};

export const QUALITY_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Standard'];

export const STANDARD_UNITS = ['Quintal', 'kg', 'Metric Tonne', 'Bags'];

