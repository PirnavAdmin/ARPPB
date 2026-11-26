import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  LandPlot,
  UserCheck,
  Sprout,
  Calendar,
  Sparkles,
  Layers,
  Tractor,
  Landmark,
  Clock,
  CheckCircle2,
  AlertCircle,
  Droplets,
  CloudSun,
  BarChart3,
  Search,
  Download,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SearchX,
  MapPin,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '../../../utils/exportUtils';

// 24 Comprehensive Agricultural Data Cards for Reverse-Engineered Operations Hub
export const AGRICULTURAL_CARDS = [
  {
    id: 'total-farmers',
    title: 'Total Farmers',
    value: '1,250',
    description: 'Registered farming members in hub',
    icon: Users,
    category: 'Farmers & Land',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: '+8.4% YoY', direction: 'up' },
    details: {
      summary: 'Total registered agricultural producers across the cluster and adjacent mandals.',
      metrics: [
        { label: 'Small & Marginal Landholders (< 2 Ha)', value: '820 Farmers (65.6%)' },
        { label: 'Medium Landholders (2-10 Ha)', value: '340 Farmers (27.2%)' },
        { label: 'Large Landholders (> 10 Ha)', value: '90 Farmers (7.2%)' },
        { label: 'Women Agricultural Producers', value: '315 Farmers (25.2%)' },
      ],
      recentActivity: '42 new farmers onboarded this month through digital e-KYC and land passbook verification.',
      targetNav: 'crops',
    },
  },
  {
    id: 'total-agricultural-land',
    title: 'Total Agricultural Land',
    value: '3,450 Acres',
    description: 'Registered farming cultivable area',
    icon: LandPlot,
    category: 'Farmers & Land',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: '+120 Acres', direction: 'up' },
    details: {
      summary: 'Verified cultivable land mapped to verified survey numbers and patta passbooks.',
      metrics: [
        { label: 'Irrigated Wetland (Ayacut Canal)', value: '2,150 Acres (62.3%)' },
        { label: 'Rainfed Dryland (Metta)', value: '1,300 Acres (37.7%)' },
        { label: 'Active Crop Coverage Area', value: '3,210 Acres (93.0%)' },
        { label: 'Fallow / Pre-Planting Prep', value: '240 Acres (7.0%)' },
      ],
      recentActivity: 'GIS geo-tagging completed for 98% registered plots in the cluster.',
      targetNav: 'crops',
    },
  },
  {
    id: 'active-farmers',
    title: 'Active Farmers',
    value: '1,080',
    description: 'Actively harvesting in Rabi 2026',
    icon: UserCheck,
    category: 'Farmers & Land',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: '86.4% Active', direction: 'up' },
    details: {
      summary: 'Producers actively logging crop growth, mandi watchlists, or dispatch orders this cycle.',
      metrics: [
        { label: 'Active in Rabi Season', value: '1,080 Producers' },
        { label: 'Dispatches in Last 30 Days', value: '412 Farmers' },
        { label: 'Pending Harvest Sales', value: '185 Farmers' },
        { label: 'Avg Monthly Mandi Trades', value: '3.4 transactions/farmer' },
      ],
      recentActivity: '86.4% active participation rate, up +4.2% from previous Kharif season.',
      targetNav: 'sales',
    },
  },
  {
    id: 'total-crops',
    title: 'Total Crops',
    value: '18 Varieties',
    description: 'Paddy, Turmeric, Groundnut, Maize',
    icon: Sprout,
    category: 'Crops & Production',
    states: ['All'],
    cropCategories: ['Cereals', 'Spices', 'Oilseeds', 'Pulses'],
    trend: { value: '+2 Varieties', direction: 'up' },
    details: {
      summary: 'Major cereal, commercial, oilseed, and spice crops currently cultivated in the hub.',
      metrics: [
        { label: 'Paddy (BPT 5204 & Sona Masoori)', value: '1,450 Acres' },
        { label: 'Turmeric (Salem & Duggirala)', value: '620 Acres' },
        { label: 'Groundnut (K6 & Kadiri)', value: '580 Acres' },
        { label: 'Maize & Bengal Gram', value: '800 Acres' },
      ],
      recentActivity: 'High-yield BPT-5204 paddy harvesting is currently at 82% completion.',
      targetNav: 'crops',
    },
  },
  {
    id: 'active-crop-seasons',
    title: 'Active Crop Seasons',
    value: '2 Seasons',
    description: 'Rabi 2026 (Harvest) & Summer Prep',
    icon: Calendar,
    category: 'Crops & Production',
    states: ['All'],
    cropCategories: ['Cereals', 'Pulses'],
    trend: { value: 'On Schedule', direction: 'up' },
    details: {
      summary: 'Agricultural cropping schedule based on regional rainfall and canal water release.',
      metrics: [
        { label: 'Rabi 2026 Season Stage', value: 'Peak Harvest & Mandi Dispatches' },
        { label: 'Summer Pulse Cropping Stage', value: 'Pre-irrigation & Land Preparation' },
        { label: 'Target Harvest Volume', value: '42,500 Quintals' },
        { label: 'Canal Water Supply Remaining', value: '45 Days Window' },
      ],
      recentActivity: 'Mandi procurement yards opened early to handle peak Rabi harvest arrivals.',
      targetNav: 'prices',
    },
  },
  {
    id: 'seed-distribution',
    title: 'Seed Distribution',
    value: '485 qtl',
    description: 'Certified subsidized seeds delivered',
    icon: Sparkles,
    category: 'Inputs & Distribution',
    states: ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu'],
    cropCategories: ['Cereals', 'Oilseeds', 'Pulses'],
    trend: { value: '94% Target', direction: 'up' },
    details: {
      summary: 'Subsidized seed distribution via AP Seeds Development Corporation & Rythu Bharosa Kendras.',
      metrics: [
        { label: 'Paddy Seeds (BPT 5204)', value: '260 Quintals' },
        { label: 'Groundnut Kernel (K6)', value: '140 Quintals' },
        { label: 'Maize Hybrid (DKC 9108)', value: '85 Quintals' },
        { label: 'Govt Subsidy Disbursed', value: '₹14.2 Lakhs (40% Grant)' },
      ],
      recentActivity: '94% of cluster seed requirement fulfilled before deadline with germination guarantees.',
      targetNav: 'crops',
    },
  },
  {
    id: 'fertilizer-distribution',
    title: 'Fertilizer Distribution',
    value: '1,240 Bags',
    description: 'Urea, DAP, MOP & Potash released',
    icon: Layers,
    category: 'Inputs & Distribution',
    states: ['Andhra Pradesh', 'Telangana', 'Maharashtra', 'Karnataka', 'Punjab'],
    cropCategories: ['Cereals', 'Commercial', 'Oilseeds'],
    trend: { value: '88% Quota', direction: 'up' },
    details: {
      summary: 'PoS Aadhaar-authenticated subsidized fertilizer allocations across village kiosks.',
      metrics: [
        { label: 'Neem-Coated Urea (45kg)', value: '620 Bags' },
        { label: 'Di-Ammonium Phosphate (DAP)', value: '380 Bags' },
        { label: 'Muriate of Potash (MOP)', value: '240 Bags' },
        { label: 'RBK Emergency Reserve Stock', value: '410 Bags' },
      ],
      recentActivity: 'Zero fertilizer stock-outs reported; buffer stock maintained for summer pulses.',
      targetNav: 'crops',
    },
  },
  {
    id: 'equipment-requests',
    title: 'Equipment Requests',
    value: '36 Requests',
    description: 'Custom Hiring Centre machinery',
    icon: Tractor,
    category: 'Inputs & Distribution',
    states: ['Andhra Pradesh', 'Telangana', 'Punjab', 'Haryana', 'Madhya Pradesh'],
    cropCategories: ['Cereals', 'Commercial'],
    trend: { value: '12 Pending', direction: 'down' },
    details: {
      summary: 'Subsidized farm machinery bookings through Custom Hiring Centres (CHCs).',
      metrics: [
        { label: 'Combine Harvester Bookings', value: '18 Units (14 Dispatched)' },
        { label: 'Tractors & Rotavators', value: '12 Units (All Active)' },
        { label: 'Solar Power Sprayers', value: '6 Units' },
        { label: 'Rental Subsidy Rate', value: '50% Government Assisted' },
      ],
      recentActivity: '24 bookings completed this week with 100% on-time field arrival rate.',
      targetNav: 'crops',
    },
  },
  {
    id: 'government-schemes',
    title: 'Government Schemes',
    value: '14 Schemes',
    description: 'PM-KISAN, Rythu Bharosa, Fasal Bima',
    icon: Landmark,
    category: 'Schemes & Governance',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: '100% Active', direction: 'up' },
    details: {
      summary: 'Central and state welfare and financial support schemes operational in the mandal.',
      metrics: [
        { label: 'PM-KISAN (16th Installment)', value: '1,120 Farmers Credited' },
        { label: 'YSR Rythu Bharosa Support', value: '1,090 Farmers Covered' },
        { label: 'PM Fasal Bima (Insurance)', value: '980 Policies Bound' },
        { label: 'Micro-Irrigation Subsidy (APMIP)', value: '145 Drip Sets Approved' },
      ],
      recentActivity: 'Direct Benefit Transfer (DBT) verification rate stands at 97.4% across the cluster.',
      targetNav: 'profile',
    },
  },
  {
    id: 'pending-applications',
    title: 'Pending Applications',
    value: '42 Orders',
    description: 'Awaiting review & dispatch clearance',
    icon: Clock,
    category: 'Schemes & Governance',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: 'Action Req.', direction: 'down' },
    details: {
      summary: 'Sale orders, transport gate passes, and subsidy requests undergoing verification.',
      metrics: [
        { label: 'Sale Order OTP Clearances', value: '18 Applications' },
        { label: 'Weighment & Moisture Certifications', value: '14 Applications' },
        { label: 'RBK Seed Subsidy Claims', value: '10 Applications' },
        { label: 'Average Clearance Time', value: '4.2 Hours' },
      ],
      recentActivity: '42 pending requests flagged for expeditious clearance before weekend mandi rush.',
      targetNav: 'otp',
    },
  },
  {
    id: 'approved-applications',
    title: 'Approved Applications',
    value: '384 Cleared',
    description: 'Verified sales & subsidies approved',
    icon: CheckCircle2,
    category: 'Schemes & Governance',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: '+24 Today', direction: 'up' },
    details: {
      summary: 'Fully authorized sales transactions, gate passes, and loan clearance certificates.',
      metrics: [
        { label: 'Farmer Direct Mandi Sales', value: '240 Orders Cleared' },
        { label: 'Inter-State Transit Gate Passes', value: '88 Issued' },
        { label: 'Subsidized Input Releases', value: '56 Approved' },
        { label: 'Dispute Rate', value: '< 0.3%' },
      ],
      recentActivity: '384 authorizations processed with digital cryptographic signatures.',
      targetNav: 'sales',
    },
  },
  {
    id: 'farmer-complaints',
    title: 'Farmer Complaints',
    value: '8 Grievances',
    description: 'Avg resolution turnaround: 24 hrs',
    icon: AlertCircle,
    category: 'Support & Analytics',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: '92% Resolved', direction: 'up' },
    details: {
      summary: 'Grievance redressal tracker for payment delays, moisture disputes, and seed quality.',
      metrics: [
        { label: 'Payment Delay Queries', value: '3 (Resolved within 48h)' },
        { label: 'Mandi Weighing Calibration', value: '2 (Inspected & Calibrated)' },
        { label: 'Water Canal Gate Timing', value: '3 (Coordinated with Irrigation)' },
        { label: 'Grievance Redressal SLA', value: '96.2% On-Time' },
      ],
      recentActivity: 'All 8 open issues assigned to mandal agricultural officers for prompt resolution.',
      targetNav: 'notifications',
    },
  },
  {
    id: 'irrigation-facilities',
    title: 'Irrigation Facilities',
    value: '94% Coverage',
    description: 'KC Canal, Borewells & Drip Systems',
    icon: Droplets,
    category: 'Farmers & Land',
    states: ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka'],
    cropCategories: ['Cereals', 'Horticulture'],
    trend: { value: 'Optimal Flow', direction: 'up' },
    details: {
      summary: 'Irrigation infrastructure status and water availability across farming blocks.',
      metrics: [
        { label: 'Kurnool-Cuddapah (KC) Canal', value: '1,840 Acres (100% Water Supply)' },
        { label: 'Solar & Grid Tube Wells', value: '980 Acres' },
        { label: 'Micro Drip & Sprinkler Systems', value: '430 Acres (30% Water Saved)' },
        { label: 'Groundwater Table Level', value: 'Safe Zone (7.2m bgl)' },
      ],
      recentActivity: 'Canal discharge running at 850 cusecs; adequate for entire crop cycle.',
      targetNav: 'crops',
    },
  },
  {
    id: 'weather-information',
    title: 'Weather Information',
    value: '28°C Sunny',
    description: 'Favorable • Rain forecast in 3 days',
    icon: CloudSun,
    category: 'Crops & Production',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: 'Dry Window', direction: 'up' },
    details: {
      summary: 'Agro-meteorological advisory from Regional Agricultural Research Station (RARS).',
      metrics: [
        { label: 'Current Ambient Temp', value: '28°C (Min 19°C - Max 32°C)' },
        { label: 'Relative Humidity', value: '62% (Ideal for Grain Drying)' },
        { label: 'Wind Speed & Direction', value: '12 km/h East-North-East' },
        { label: 'Rain Forecast (Next 7 Days)', value: 'Scattered Showers in 72h (15mm)' },
      ],
      recentActivity: 'Advisory: Expedite threshing and open-yard drying before anticipated showers.',
      targetNav: 'prices',
    },
  },
  {
    id: 'agriculture-reports',
    title: 'Agriculture Reports',
    value: '24 Reports',
    description: 'Yield audits, mandi prices & settlements',
    icon: BarChart3,
    category: 'Support & Analytics',
    states: ['All'],
    cropCategories: ['All'],
    trend: { value: 'Export Ready', direction: 'up' },
    details: {
      summary: 'Monthly production summaries, audit trails, and mandi price trend sheets.',
      metrics: [
        { label: 'Cluster Harvest Yield Summary', value: 'Rabi 2026 Audit Ready' },
        { label: 'OTP Multi-Party Settlement Log', value: '1,248 Verified Records' },
        { label: 'Bank DBT Disbursement Audit', value: '100% Reconciled' },
        { label: 'Available Export Formats', value: 'PDF, CSV, Excel' },
      ],
      recentActivity: 'Audited reports generated and compliant with Agricultural Marketing Dept standards.',
      targetNav: 'sales',
    },
  },
  {
    id: 'soil-health-cards',
    title: 'Soil Health Cards Issued',
    value: '1,140 Cards',
    description: 'Macro & micro-nutrient NPK tested',
    icon: CheckCircle2,
    category: 'Support & Analytics',
    states: ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Maharashtra'],
    cropCategories: ['All'],
    trend: { value: '91.2% Tested', direction: 'up' },
    details: {
      summary: 'Periodic soil testing providing customized fertilizer recommendations to avoid soil degradation.',
      metrics: [
        { label: 'Nitrogen (N) Content', value: 'Medium (240 kg/ha)' },
        { label: 'Phosphorus (P) Content', value: 'High (45 kg/ha)' },
        { label: 'Potassium (K) Content', value: 'Sufficient (280 kg/ha)' },
        { label: 'Soil Organic Carbon (SOC)', value: '0.62% (Recommended > 0.75%)' },
      ],
      recentActivity: '120 soil sample reports uploaded to the national soil health portal this week.',
      targetNav: 'crops',
    },
  },
  {
    id: 'kcc-loans',
    title: 'Kisan Credit Card (KCC) Loans',
    value: '₹3.85 Cr',
    description: 'Interest-subvention institutional credit',
    icon: Landmark,
    category: 'Schemes & Governance',
    states: ['All'],
    cropCategories: ['Cereals', 'Commercial', 'Oilseeds'],
    trend: { value: '4% Subsidized', direction: 'up' },
    details: {
      summary: 'Low-interest short-term production credit disbursed through District Co-op Central Banks.',
      metrics: [
        { label: 'Beneficiary Farmers', value: '740 Borrowers' },
        { label: 'Average Loan Amount', value: '₹52,000 per Kisan' },
        { label: 'Prompt Repayment Incentive', value: '3% Extra Interest Rebate' },
        { label: 'Non-Performing Assets (NPA)', value: '< 1.4%' },
      ],
      recentActivity: 'Rabi crop loan renewals completed seamlessly with zero branch paperwork.',
      targetNav: 'profile',
    },
  },
  {
    id: 'mandi-daily-arrivals',
    title: 'Mandi Daily Arrivals',
    value: '42,850 qtl',
    description: 'Physical commodities arriving at yards',
    icon: Scale,
    category: 'Crops & Production',
    states: ['Andhra Pradesh', 'Telangana', 'Maharashtra'],
    cropCategories: ['Cereals', 'Spices', 'Oilseeds'],
    trend: { value: '+14% Volume', direction: 'up' },
    details: {
      summary: 'Physical intake volume across Kurnool, Guntur, and regional wholesale market yards.',
      metrics: [
        { label: 'Paddy Daily Inflow', value: '24,500 Quintals' },
        { label: 'Chilli & Turmeric Bids', value: '11,200 Quintals' },
        { label: 'Oilseed Inflow', value: '7,150 Quintals' },
        { label: 'Active Trading Bays', value: '48 Auction Platforms' },
      ],
      recentActivity: 'Electronic weighing slips integrated with e-NAM digital clearing house.',
      targetNav: 'prices',
    },
  },
  {
    id: 'cold-storage-capacity',
    title: 'Cold Storage Capacity',
    value: '18,500 MT',
    description: 'Temperature-controlled spice preservation',
    icon: Layers,
    category: 'Inputs & Distribution',
    states: ['Andhra Pradesh', 'Telangana', 'Maharashtra', 'Gujarat'],
    cropCategories: ['Spices', 'Horticulture'],
    trend: { value: '82% Occupied', direction: 'up' },
    details: {
      summary: 'Multi-chamber cold warehouses preserving red chilli, turmeric, and perishables.',
      metrics: [
        { label: 'Total Capacity', value: '18,500 Metric Tonnes' },
        { label: 'Current Stored Produce', value: '15,170 MT' },
        { label: 'Temperature Range', value: '4°C to 10°C (RH 65%)' },
        { label: 'WDRA Warehouse Receipts Issued', value: '310 Negotiable e-NWRs' },
      ],
      recentActivity: 'Farmers pledged electronic receipts for instant bank pledge loans at 7% APR.',
      targetNav: 'crops',
    },
  },
  {
    id: 'organic-farming',
    title: 'Organic Farming Acreage',
    value: '420 Acres',
    description: 'Paramparagat Krishi certified plots',
    icon: Sprout,
    category: 'Farmers & Land',
    states: ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra'],
    cropCategories: ['Spices', 'Pulses', 'Horticulture'],
    trend: { value: '+65 Acres YoY', direction: 'up' },
    details: {
      summary: 'Zero Budget Natural Farming (ZBNF) and certified organic agricultural clusters.',
      metrics: [
        { label: 'Certified Organic Farmers', value: '145 Producers' },
        { label: 'Major Crops Covered', value: 'Turmeric, Millets, Red Gram' },
        { label: 'Organic Premium Realization', value: '+22% Over Mandi Rates' },
        { label: 'Bio-Input Centers Active', value: '18 Village Units' },
      ],
      recentActivity: 'PGS-India organic certification audit completed successfully with zero pesticide residues.',
      targetNav: 'crops',
    },
  },
  {
    id: 'drone-spraying',
    title: 'Drone Spraying Bookings',
    value: '28 Missions',
    description: 'Precision nano-urea & pest control',
    icon: Tractor,
    category: 'Inputs & Distribution',
    states: ['Andhra Pradesh', 'Telangana', 'Punjab', 'Haryana'],
    cropCategories: ['Commercial', 'Cereals'],
    trend: { value: '95% Efficiency', direction: 'up' },
    details: {
      summary: 'Drone as a Service (DaaS) subsidized spraying for rapid foliar nutrition and pest defense.',
      metrics: [
        { label: 'Acreage Covered per Day', value: '25-30 Acres/Drone' },
        { label: 'Water Savings Achieved', value: '90% Less Water vs Manual' },
        { label: 'Chemical Exposure Reduction', value: '100% Contactless' },
        { label: 'Farmer Rental Charge', value: '₹350/Acre (Subsidized)' },
      ],
      recentActivity: '12 village clusters completed scheduled Nano-Urea drone spraying in record time.',
      targetNav: 'crops',
    },
  },
  {
    id: 'solar-pumps',
    title: 'Solar Pump Installations',
    value: '165 Units',
    description: 'PM-KUSUM grid & standalone pumps',
    icon: CloudSun,
    category: 'Farmers & Land',
    states: ['Andhra Pradesh', 'Telangana', 'Rajasthan', 'Gujarat', 'Madhya Pradesh'],
    cropCategories: ['All'],
    trend: { value: 'Zero Fuel Cost', direction: 'up' },
    details: {
      summary: 'Clean solar photovoltaic irrigation pumps installed under the PM-KUSUM initiative.',
      metrics: [
        { label: '5 HP Standalone DC Pumps', value: '110 Installations' },
        { label: '7.5 HP Grid-Tied Pumps', value: '55 Installations' },
        { label: 'Annual Electricity Saved', value: '4.8 Lakh kWh' },
        { label: 'Diesel Displacement Value', value: '₹32 Lakhs Saved' },
      ],
      recentActivity: 'Feeder solarization project energized 25 additional pumps in dryland belts.',
      targetNav: 'crops',
    },
  },
  {
    id: 'pm-fasal-bima',
    title: 'Crop Insurance Claims Settled',
    value: '₹64.2 Lakhs',
    description: 'PM Fasal Bima weather & yield claim',
    icon: Landmark,
    category: 'Schemes & Governance',
    states: ['All'],
    cropCategories: ['Cereals', 'Commercial', 'Oilseeds'],
    trend: { value: '100% Settled', direction: 'up' },
    details: {
      summary: 'Comprehensive yield insurance coverage and localized calamity risk indemnity settlements.',
      metrics: [
        { label: 'Claims Settled Successfully', value: '342 Farmer Beneficiaries' },
        { label: 'Average Claim Disbursed', value: '₹18,770 per Farmer' },
        { label: 'Settlement TAT', value: '21 Days Post-Harvest CCE' },
        { label: 'Premium Subsidized by Govt', value: '85% Cost Borne by State/Centre' },
      ],
      recentActivity: 'All localized unseasonal rain claims settled directly into farmer Aadhaar-linked accounts.',
      targetNav: 'profile',
    },
  },
  {
    id: 'micro-irrigation-drip',
    title: 'Micro-Irrigation Drip Sets',
    value: '340 Units',
    description: 'APMIP 90% subsidized drip systems',
    icon: Droplets,
    category: 'Farmers & Land',
    states: ['Andhra Pradesh', 'Telangana', 'Gujarat', 'Tamil Nadu'],
    cropCategories: ['Horticulture', 'Commercial'],
    trend: { value: '+45 This Month', direction: 'up' },
    details: {
      summary: 'Drip irrigation and fertigation systems installed to optimize water efficiency.',
      metrics: [
        { label: 'Drip Lines Installed', value: '850 km Piping' },
        { label: 'Water Conservation Rate', value: '45-50% Savings' },
        { label: 'Crop Yield Boost', value: '+28% Productivity' },
        { label: 'Subsidy Eligibility', value: 'Up to 90% for SC/ST/Small Farmers' },
      ],
      recentActivity: 'Field inspection and fertigation unit commissioning cleared for 45 new installations.',
      targetNav: 'crops',
    },
  },
];

export const STATES_LIST = [
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Punjab',
  'Haryana',
  'Gujarat',
  'Rajasthan',
  'Madhya Pradesh',
  'Uttar Pradesh',
  'Kerala',
];

export const CROP_CATEGORIES_LIST = [
  'Cereals (Paddy, Maize, Wheat)',
  'Spices (Turmeric, Chilli)',
  'Oilseeds (Groundnut, Sunflower, Soybean)',
  'Commercial & Fiber (Cotton, Sugarcane)',
  'Pulses & Legumes (Bengal Gram, Red Gram)',
  'Horticulture & Vegetables',
];

// Searchable Dropdown Component with clean styling, internal search, clear/reset, and click-outside dismissal
function SearchableDropdown({
  label,
  value,
  onChange,
  onClear,
  options,
  placeholder,
  icon: Icon,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [options, search]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#0F766E]" />}
        <span>{label}</span>
      </label>

      {/* Trigger Button */}
      <div
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearch('');
        }}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none ${
          isOpen
            ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 bg-white text-[#0F172A]'
            : value
            ? 'border-[#14B8A6] bg-emerald-50/40 text-[#0F766E]'
            : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-white hover:border-slate-300'
        }`}
      >
        <span className="truncate">
          {value || <span className="text-[#94A3B8] font-normal">{placeholder}</span>}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setSearch('');
              }}
              className="p-0.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#0F766E]' : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-[#E2E8F0] shadow-xl p-2 max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 min-w-[240px]">
          {/* Internal Search Input */}
          <div className="relative mb-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] focus:bg-white transition-all"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto space-y-0.5 flex-1 pr-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#94A3B8]">
                No options match &quot;{search}&quot;
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#CCFBF1] text-[#0F766E]'
                        : 'text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0F766E] shrink-0 stroke-[3]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FarmerCardsDataModule({ onNavigate }) {
  // Filter States (Layout: 1. State, 2. Crop Category, 3. Search)
  const [selectedState, setSelectedState] = useState('');
  const [selectedCropCategory, setSelectedCropCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination States (Layout: 5. Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // 10, 20, 50

  // Interactive Detail Modal
  const [selectedCard, setSelectedCard] = useState(null);

  // Reset to page 1 whenever filters or search criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedState, selectedCropCategory, searchQuery, recordsPerPage]);

  // Filter Cards based on State, Crop Category, and Search Query
  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return AGRICULTURAL_CARDS.filter((card) => {
      // 1. State Filter
      const matchState =
        !selectedState ||
        card.states.includes('All') ||
        card.states.includes(selectedState);

      // 2. Crop Category Filter
      const matchCategory =
        !selectedCropCategory ||
        card.cropCategories.includes('All') ||
        card.cropCategories.some((c) => selectedCropCategory.toLowerCase().includes(c.toLowerCase()));

      // 3. Search Query Filter
      const matchSearch =
        !q ||
        card.title.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.value.toLowerCase().includes(q) ||
        card.category.toLowerCase().includes(q) ||
        card.details.summary.toLowerCase().includes(q) ||
        card.details.metrics.some(
          (m) =>
            m.label.toLowerCase().includes(q) ||
            m.value.toLowerCase().includes(q)
        );

      return matchState && matchCategory && matchSearch;
    });
  }, [selectedState, selectedCropCategory, searchQuery]);

  // Pagination Calculations
  const totalRecords = filteredCards.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);
  const paginatedCards = useMemo(() => {
    return filteredCards.slice(startIndex, endIndex);
  }, [filteredCards, startIndex, endIndex]);

  // Reset All Filters
  const handleResetFilters = () => {
    setSelectedState('');
    setSelectedCropCategory('');
    setSearchQuery('');
    setCurrentPage(1);
    toast.info('All filters and search criteria reset.');
  };

  // Export CSV
  const handleExportAllCards = () => {
    const rows = filteredCards.map((c) => ({
      title: c.title,
      value: c.value,
      category: c.category,
      description: c.description,
      trend: c.trend ? c.trend.value : 'N/A',
    }));

    exportToCSV(
      rows,
      [
        { key: 'title', header: 'Metric Name' },
        { key: 'value', header: 'Current Value' },
        { key: 'category', header: 'Domain Category' },
        { key: 'description', header: 'Description' },
        { key: 'trend', header: 'Trend / Status' },
      ],
      'cards_data_reverse_engine_export.csv'
    );
    toast.success('Filtered Cards Data exported to CSV.');
  };

  // Generate Page Numbers for Pagination
  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  const hasActiveFilters = Boolean(selectedState || selectedCropCategory || searchQuery);

  return (
    <div className="space-y-5">
      {/* Cards Data Header & Overview */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/25">
              Cards Data Reverse Engine
            </span>
            <span className="text-xs text-[#64748B]">
              Total Records: <strong className="text-[#0F172A]">{totalRecords}</strong> Cards
            </span>
          </div>
          <h3 className="text-base font-bold text-[#0F766E] mt-1 tracking-tight">
            Agricultural Intelligence &amp; Data Operations Hub
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Filter, search, and paginate through agricultural data cards across state jurisdictions and commodity categories.
          </p>
        </div>

        {/* Action: Export CSV */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportAllCards}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-all duration-200 cursor-pointer shadow-xs shrink-0"
          >
            <Download className="w-3.5 h-3.5 stroke-[2] shrink-0" />
            <span>Export CSV ({totalRecords})</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH SECTION (Strict Expected Layout Order: 1. State, 2. Crop Category, 3. Search Bar) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        {/* 1 & 2: Left-Side Filters (Select State & Crop Category Dropdowns) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* 1. Select State Dropdown (Left Side) */}
          <div className="w-full sm:w-72">
            <SearchableDropdown
              label="Select State"
              value={selectedState}
              onChange={(val) => setSelectedState(val)}
              onClear={() => setSelectedState('')}
              options={STATES_LIST}
              placeholder="All States (Select State)..."
              icon={MapPin}
            />
          </div>

          {/* 2. Crop Category Dropdown (Left Side) */}
          <div className="w-full sm:w-80">
            <SearchableDropdown
              label="Crop Category"
              value={selectedCropCategory}
              onChange={(val) => setSelectedCropCategory(val)}
              onClear={() => setSelectedCropCategory('')}
              options={CROP_CATEGORIES_LIST}
              placeholder="All Crop Categories..."
              icon={Sprout}
            />
          </div>

          {/* Clear / Reset All Filters Shortcut */}
          {hasActiveFilters && (
            <div className="sm:self-end sm:mb-0.5">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="Reset all active filters and search"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Search Bar (Below the Two Dropdown Filters) */}
        <div className="w-full pt-1">
          <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Search Cards &amp; Commodities</span>
            </span>
            {searchQuery && (
              <span className="text-[10px] text-slate-400 font-normal">
                Press Esc or click ✕ to clear
              </span>
            )}
          </label>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('')}
              placeholder="Search by crop name, card title, or relevant keywords (e.g. Paddy, Seeds, Irrigation, Fertilizer, Land, PM-KISAN)..."
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9]">
            <span className="text-[11px] font-medium text-[#64748B]">Active Filters:</span>

            {selectedState && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30">
                <MapPin className="w-3 h-3" />
                <span>State: {selectedState}</span>
                <button
                  type="button"
                  onClick={() => setSelectedState('')}
                  className="hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCropCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Sprout className="w-3 h-3" />
                <span>Category: {selectedCropCategory.split(' ')[0]}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCropCategory('')}
                  className="hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <Search className="w-3 h-3" />
                <span>&quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-rose-600 hover:underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 4. CARDS DATA GRID (Below Filter and Search Section) */}
      <div>
        {paginatedCards.length === 0 ? (
          /* User-Friendly Empty State */
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-2xs">
              <SearchX className="w-7 h-7 stroke-[2]" />
            </div>
            <h4 className="text-base font-bold text-[#0F172A]">No Matching Cards Found</h4>
            <p className="text-xs text-[#64748B] mt-1.5 mb-5 max-w-sm">
              We couldn&apos;t find any agricultural cards matching your selected state, crop category, or search keywords.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters &amp; View All Cards</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedCards.map((card) => {
              const Icon = card.icon;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  className="group w-full h-[148px] text-left rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between transition-all duration-200 hover:border-[#14B8A6] hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                >
                  {/* Top Section: Title on Left, Uniform Icon Container on Right */}
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#64748B] leading-snug truncate">
                      {card.title}
                    </span>

                    <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] rounded-xl bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/25 flex items-center justify-center shrink-0 group-hover:bg-[#0F766E] group-hover:text-white transition-colors duration-200">
                      <Icon className="w-5 h-5 stroke-[2] shrink-0" />
                    </div>
                  </div>

                  {/* Middle Section: Full-Width Large KPI Value */}
                  <div className="my-1 w-full">
                    <p className="text-xl xl:text-[21px] 2xl:text-2xl font-extrabold text-[#0F766E] tracking-tight leading-tight whitespace-nowrap truncate">
                      {card.value}
                    </p>
                  </div>

                  {/* Bottom Section: Supporting Info & Directional Arrow */}
                  <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-medium text-[#64748B] truncate">
                      {card.description}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {card.trend && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            card.trend.direction === 'down'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-[#DCFCE7] text-[#16A34A]'
                          }`}
                        >
                          {card.trend.direction === 'down' ? (
                            <TrendingDown className="w-3 h-3 shrink-0" />
                          ) : (
                            <TrendingUp className="w-3 h-3 shrink-0" />
                          )}
                          {card.trend.value}
                        </span>
                      )}
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F766E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. PAGINATION (At the Bottom of the Cards Section) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 px-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Total Records & Current Page Information */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <span>
            Showing <strong className="text-[#0F172A]">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="text-[#0F172A]">{endIndex}</strong> of{' '}
            <strong className="text-[#0F172A]">{totalRecords}</strong> records
          </span>
          <span className="hidden sm:inline-block text-slate-300">•</span>
          <span className="hidden sm:inline-block font-medium">
            Page <strong className="text-[#0F172A]">{currentPage}</strong> of <strong className="text-[#0F172A]">{totalPages}</strong>
          </span>
        </div>

        {/* Page Controls & Records Per Page Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Records Per Page Selector (10, 20, 50) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748B] font-medium">Show:</span>
            <select
              value={recordsPerPage}
              onChange={(e) => {
                setRecordsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-bold bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all cursor-pointer shadow-2xs"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          {/* Previous Button, Page Numbers & Next Button */}
          <div className="inline-flex items-center gap-1">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page Number Buttons */}
            {pageNumbers.map((num) => {
              const isActive = num === currentPage;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalRecords === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Detail Modal for Clicked Card */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between gap-3 bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/25 flex items-center justify-center shrink-0">
                  {React.createElement(selectedCard.icon, { className: 'w-6 h-6 stroke-[2]' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
                      {selectedCard.category}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                      {selectedCard.trend?.value || 'Verified'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#0F766E]">{selectedCard.title}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Highlight Metric Box */}
              <div className="bg-linear-to-br from-[#CCFBF1]/30 to-[#F0FDFA] p-4 rounded-xl border border-[#14B8A6]/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider block">
                    Current Operational Status
                  </span>
                  <div className="text-2xl font-black text-[#0F766E] tracking-tight mt-0.5">
                    {selectedCard.value}
                  </div>
                </div>
                <span className="text-xs font-medium text-[#64748B] text-right max-w-[180px]">
                  {selectedCard.description}
                </span>
              </div>

              {/* Summary Description */}
              <p className="text-xs text-[#475569] leading-relaxed">
                {selectedCard.details.summary}
              </p>

              {/* Specific Sub-Metrics Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                  Cluster Breakdown &amp; Quotas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCard.details.metrics.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] flex flex-col justify-between"
                    >
                      <span className="text-[11px] text-[#64748B] font-medium leading-snug">
                        {item.label}
                      </span>
                      <strong className="text-xs font-bold text-[#0F172A] mt-1">
                        {item.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Alert */}
              <div className="bg-[#F0FDF4] p-3 rounded-xl border border-[#BBF7D0] text-xs text-[#166534] flex items-start gap-2">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <span>{selectedCard.details.recentActivity}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const rows = selectedCard.details.metrics.map((m) => ({
                    metric: m.label,
                    value: m.value,
                  }));
                  exportToCSV(
                    rows,
                    [
                      { key: 'metric', header: 'Breakdown' },
                      { key: 'value', header: 'Status / Value' },
                    ],
                    `farmer_${selectedCard.id}_report.csv`
                  );
                  toast.success(`Exported ${selectedCard.title} report.`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2]" />
                <span>Export Audit</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedCard.details.targetNav && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedCard.details.targetNav;
                      setSelectedCard(null);
                      onNavigate(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs"
                  >
                    <span>View Section</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
