import { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Radio,
  MapPin,
  Download,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Sparkles,
  LayoutGrid,
  List,
  Bell,
  X,
  Scale,
  Calendar,
  Clock,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFarmer } from '../context/FarmerContext';
import FarmerPageHeader from '../components/FarmerPageHeader';
import FarmerStatCard from '../components/FarmerStatCard';
import { formatCurrency } from '../utils/farmerHelpers';
import { exportToCSV } from '../../../utils/exportUtils';

// 12 Authentic Regional Mandi Rates across Andhra Pradesh & Telangana
const INITIAL_MANDI_PRICES = [
  {
    id: 'MP-01',
    crop: 'Paddy (BPT 5204)',
    variety: 'Samba Mahsuri',
    category: 'Cereal',
    market: 'Kurnool APMC Market Yard',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    todayPrice: 2280,
    prevPrice: 2250,
    minPrice: 2150,
    maxPrice: 2350,
    avgPrice: 2240,
    msp: 2183,
    change: '+1.33%',
    changeAmount: '+₹30',
    trend: 'up',
    arrivals: '4,850 qtl',
    moistureAvg: '13.2%',
    quality: 'FAQ Grade A',
    location: 'Kurnool AP',
    lastUpdated: 'Today, 11:30 AM',
    bidsCount: 28,
    history: [2190, 2210, 2225, 2240, 2235, 2250, 2280],
  },
  {
    id: 'MP-02',
    crop: 'Turmeric (Salem)',
    variety: 'Curcumin > 3.5%',
    category: 'Spices',
    market: 'Nizamabad APMC Yard',
    district: 'Nizamabad',
    state: 'Telangana',
    todayPrice: 8450,
    prevPrice: 8100,
    minPrice: 7900,
    maxPrice: 8850,
    avgPrice: 8320,
    msp: 6500,
    change: '+4.32%',
    changeAmount: '+₹350',
    trend: 'up',
    arrivals: '1,920 qtl',
    moistureAvg: '11.5%',
    quality: 'Export Grade',
    location: 'Nizamabad TG',
    lastUpdated: 'Today, 11:15 AM',
    bidsCount: 34,
    history: [7950, 8020, 8100, 8050, 8100, 8250, 8450],
  },
  {
    id: 'MP-03',
    crop: 'Groundnut (Pod K-6)',
    variety: 'Kadiri Bold',
    category: 'Oilseed',
    market: 'Adoni Oilseed Market Yard',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    todayPrice: 6120,
    prevPrice: 6040,
    minPrice: 5700,
    maxPrice: 6350,
    avgPrice: 6010,
    msp: 5850,
    change: '+1.32%',
    changeAmount: '+₹80',
    trend: 'up',
    arrivals: '2,400 qtl',
    moistureAvg: '8.4%',
    quality: 'High Oil Content',
    location: 'Adoni AP',
    lastUpdated: 'Today, 10:45 AM',
    bidsCount: 19,
    history: [5880, 5920, 5980, 6010, 6040, 6080, 6120],
  },
  {
    id: 'MP-04',
    crop: 'Maize (Hybrid Yellow)',
    variety: 'Pioneer 3396',
    category: 'Cereal',
    market: 'Rajahmundry Grain Yard',
    district: 'East Godavari',
    state: 'Andhra Pradesh',
    todayPrice: 2680,
    prevPrice: 2700,
    minPrice: 2480,
    maxPrice: 2780,
    avgPrice: 2610,
    msp: 2090,
    change: '-0.74%',
    changeAmount: '-₹20',
    trend: 'down',
    arrivals: '3,150 qtl',
    moistureAvg: '14.0%',
    quality: 'Feed Grade FAQ',
    location: 'East Godavari AP',
    lastUpdated: 'Today, 09:10 AM',
    bidsCount: 15,
    history: [2640, 2670, 2690, 2710, 2700, 2710, 2680],
  },
  {
    id: 'MP-05',
    crop: 'Cotton (Long Staple)',
    variety: 'Bollgard II Bt',
    category: 'Commercial',
    market: 'Warangal Cotton Market',
    district: 'Warangal',
    state: 'Telangana',
    todayPrice: 6320,
    prevPrice: 6180,
    minPrice: 6000,
    maxPrice: 6550,
    avgPrice: 6240,
    msp: 6080,
    change: '+2.26%',
    changeAmount: '+₹140',
    trend: 'up',
    arrivals: '5,200 qtl',
    moistureAvg: '9.8%',
    quality: 'Micronaire 3.8-4.2',
    location: 'Warangal TG',
    lastUpdated: 'Today, 11:00 AM',
    bidsCount: 42,
    history: [6020, 6080, 6120, 6150, 6180, 6240, 6320],
  },
  {
    id: 'MP-06',
    crop: 'Chilli (Teja Super Hot)',
    variety: 'SH-48 Export',
    category: 'Spices',
    market: 'Guntur Mirchi Yard',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    todayPrice: 16900,
    prevPrice: 16250,
    minPrice: 15500,
    maxPrice: 18200,
    avgPrice: 16650,
    msp: 12500,
    change: '+4.00%',
    changeAmount: '+₹650',
    trend: 'up',
    arrivals: '8,400 qtl',
    moistureAvg: '10.2%',
    quality: 'Deep Red SHU 45000+',
    location: 'Guntur AP',
    lastUpdated: 'Today, 10:30 AM',
    bidsCount: 56,
    history: [15700, 15900, 16100, 16300, 16250, 16500, 16900],
  },
  {
    id: 'MP-07',
    crop: 'Wheat (Sharbati Golden)',
    variety: 'Lok-1 Seed Selection',
    category: 'Cereal',
    market: 'Hyderabad Grain Market',
    district: 'Hyderabad',
    state: 'Telangana',
    todayPrice: 2950,
    prevPrice: 2900,
    minPrice: 2650,
    maxPrice: 3120,
    avgPrice: 2880,
    msp: 2275,
    change: '+1.72%',
    changeAmount: '+₹50',
    trend: 'up',
    arrivals: '1,450 qtl',
    moistureAvg: '11.8%',
    quality: 'Lustrous Premium',
    location: 'Hyderabad TG',
    lastUpdated: 'Today, 08:45 AM',
    bidsCount: 22,
    history: [2780, 2810, 2850, 2890, 2900, 2920, 2950],
  },
  {
    id: 'MP-08',
    crop: 'Bengal Gram (Desi Chana)',
    variety: 'JG-11 Wilt Resistant',
    category: 'Pulses',
    market: 'Nandyal Dal Market Yard',
    district: 'Nandyal',
    state: 'Andhra Pradesh',
    todayPrice: 5450,
    prevPrice: 5350,
    minPrice: 5100,
    maxPrice: 5650,
    avgPrice: 5380,
    msp: 5440,
    change: '+1.87%',
    changeAmount: '+₹100',
    trend: 'up',
    arrivals: '2,800 qtl',
    moistureAvg: '12.0%',
    quality: 'FAQ Bold Grain',
    location: 'Nandyal AP',
    lastUpdated: 'Today, 09:50 AM',
    bidsCount: 26,
    history: [5200, 5260, 5300, 5320, 5350, 5400, 5450],
  },
  {
    id: 'MP-09',
    crop: 'Red Gram (Tur Dal / Arhar)',
    variety: 'Maruti ICP 8863',
    category: 'Pulses',
    market: 'Tandur Red Gram Yard',
    district: 'Vikarabad',
    state: 'Telangana',
    todayPrice: 7350,
    prevPrice: 7420,
    minPrice: 7000,
    maxPrice: 7650,
    avgPrice: 7280,
    msp: 7000,
    change: '-0.94%',
    changeAmount: '-₹70',
    trend: 'down',
    arrivals: '1,100 qtl',
    moistureAvg: '11.2%',
    quality: 'GI Tagged Tandur',
    location: 'Vikarabad TG',
    lastUpdated: 'Today, 10:10 AM',
    bidsCount: 18,
    history: [7500, 7480, 7450, 7460, 7420, 7390, 7350],
  },
  {
    id: 'MP-10',
    crop: 'Sunflower (Seed)',
    variety: 'KBSH-44 Hybrid',
    category: 'Oilseed',
    market: 'Kadapa Oilseeds Yard',
    district: 'YSR Kadapa',
    state: 'Andhra Pradesh',
    todayPrice: 4850,
    prevPrice: 4780,
    minPrice: 4600,
    maxPrice: 5050,
    avgPrice: 4810,
    msp: 6760,
    change: '+1.46%',
    changeAmount: '+₹70',
    trend: 'up',
    arrivals: '850 qtl',
    moistureAvg: '9.5%',
    quality: 'Oil Content 42%',
    location: 'Kadapa AP',
    lastUpdated: 'Today, 11:20 AM',
    bidsCount: 14,
    history: [4680, 4710, 4740, 4760, 4780, 4820, 4850],
  },
  {
    id: 'MP-11',
    crop: 'Paddy (Sona Masoori)',
    variety: 'BPT 3291 Deluxe',
    category: 'Cereal',
    market: 'Tenali Rice Terminal Yard',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    todayPrice: 2420,
    prevPrice: 2390,
    minPrice: 2280,
    maxPrice: 2500,
    avgPrice: 2395,
    msp: 2203,
    change: '+1.25%',
    changeAmount: '+₹30',
    trend: 'up',
    arrivals: '6,200 qtl',
    moistureAvg: '12.8%',
    quality: 'Fine Scented Grain',
    location: 'Guntur AP',
    lastUpdated: 'Today, 11:40 AM',
    bidsCount: 38,
    history: [2320, 2340, 2360, 2380, 2390, 2400, 2420],
  },
  {
    id: 'MP-12',
    crop: 'Soybean (Yellow)',
    variety: 'JS 335',
    category: 'Oilseed',
    market: 'Adilabad Grain APMC',
    district: 'Adilabad',
    state: 'Telangana',
    todayPrice: 4620,
    prevPrice: 4650,
    minPrice: 4400,
    maxPrice: 4800,
    avgPrice: 4590,
    msp: 4600,
    change: '-0.65%',
    changeAmount: '-₹30',
    trend: 'down',
    arrivals: '1,750 qtl',
    moistureAvg: '12.5%',
    quality: 'High Protein Bean',
    location: 'Adilabad TG',
    lastUpdated: 'Today, 09:30 AM',
    bidsCount: 16,
    history: [4710, 4690, 4680, 4670, 4650, 4640, 4620],
  },
];

const CATEGORIES = [
  'All Commodities',
  'Cereal',
  'Spices',
  'Oilseed',
  'Commercial',
  'Pulses',
];

export default function MarketPrices() {
  const { searchQuery: globalSearch, navigateTo } = useFarmer();

  const [pricesData, setPricesData] = useState(INITIAL_MANDI_PRICES);
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedCropCategory, setSelectedCropCategory] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All Commodities');
  const [selectedState, setSelectedState] = useState('All');
  const [trendFilter, setTrendFilter] = useState('All'); // 'All' | 'up' | 'down'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [selectedCropDetail, setSelectedCropDetail] = useState(null);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(() => new Date());
  const [flashingCropId, setFlashingCropId] = useState(null);

  const effectiveSearch = (globalSearch || internalSearch).trim().toLowerCase();

  // Reset to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [internalSearch, globalSearch, selectedCropCategory, selectedCategory, selectedState, trendFilter, pageSize]);

  // Simulated Live Fluctuations
  const simulateLiveTick = (showNotification = false) => {
    setIsRefreshing(true);
    setPricesData((prevPrices) => {
      // Pick 2 or 3 random commodities to fluctuate realistically
      const changedIndices = new Set();
      while (changedIndices.size < Math.min(3, prevPrices.length)) {
        changedIndices.add(Math.floor(Math.random() * prevPrices.length));
      }

      return prevPrices.map((item, idx) => {
        if (!changedIndices.has(idx)) return item;

        // Fluctuates slightly between -1.5% and +2.0%
        const deltaPct = (Math.random() * 3.5 - 1.5) / 100;
        const deltaValue = Math.round(item.todayPrice * deltaPct);
        const newTodayPrice = Math.max(item.minPrice, Math.min(item.maxPrice + 100, item.todayPrice + deltaValue));
        const diff = newTodayPrice - item.prevPrice;
        const pctDiff = ((diff / item.prevPrice) * 100).toFixed(2);
        const isUp = diff >= 0;

        setFlashingCropId(item.id);

        return {
          ...item,
          todayPrice: newTodayPrice,
          change: `${isUp ? '+' : ''}${pctDiff}%`,
          changeAmount: `${isUp ? '+₹' : '-₹'}${Math.abs(diff)}`,
          trend: isUp ? 'up' : 'down',
          lastUpdated: 'Just now',
          history: [...item.history.slice(1), newTodayPrice],
          bidsCount: Math.max(10, item.bidsCount + (Math.random() > 0.5 ? 1 : -1)),
        };
      });
    });

    setLastSyncedTime(new Date());

    setTimeout(() => {
      setIsRefreshing(false);
      setFlashingCropId(null);
    }, 600);

    if (showNotification) {
      toast.success('Live Mandi Rates synchronized across AP & Telangana yards.');
    }
  };

  // Live Auto-Refresh Timer (Every 10 seconds if live tracking is active)
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      simulateLiveTick(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Filter Logic with Specific Crop / Commodity Category Selection (Chilli, Turmeric, Paddy, etc.)
  const filteredAndSortedPrices = useMemo(() => {
    return pricesData.filter((item) => {
      const matchSearch =
        !effectiveSearch ||
        item.crop.toLowerCase().includes(effectiveSearch) ||
        item.variety.toLowerCase().includes(effectiveSearch) ||
        item.market.toLowerCase().includes(effectiveSearch) ||
        item.district.toLowerCase().includes(effectiveSearch) ||
        item.state.toLowerCase().includes(effectiveSearch);

      // Commodity / Crop Category Filter (matches Chilli, Turmeric, Paddy, etc. or broad category)
      const matchCropCategory =
        selectedCropCategory === 'All' ||
        item.crop.toLowerCase().includes(selectedCropCategory.toLowerCase()) ||
        item.category.toLowerCase() === selectedCropCategory.toLowerCase();

      // Category Pills Filter
      const matchCat =
        selectedCategory === 'All Commodities' || item.category === selectedCategory;

      const matchState =
        selectedState === 'All' || item.state === selectedState;

      const matchTrend =
        trendFilter === 'All' || item.trend === trendFilter;

      return matchSearch && matchCropCategory && matchCat && matchState && matchTrend;
    });
  }, [pricesData, effectiveSearch, selectedCropCategory, selectedCategory, selectedState, trendFilter]);

  // Pagination Calculations
  const totalItems = filteredAndSortedPrices.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedPrices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedPrices.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedPrices, currentPage, pageSize]);

  // Key KPI metrics
  const kpis = useMemo(() => {
    const totalToday = pricesData.reduce((sum, p) => sum + p.todayPrice, 0);
    const avgIndex = Math.round(totalToday / (pricesData.length || 1));
    const gainers = pricesData.filter((p) => p.trend === 'up');
    const topGainer = [...pricesData].sort(
      (a, b) => parseFloat(b.change) - parseFloat(a.change)
    )[0];

    return {
      avgIndex,
      gainersCount: gainers.length,
      topGainer,
      totalArrivals: '42,850 qtl',
    };
  }, [pricesData]);

  // Export to CSV
  const handleExportCSV = () => {
    const rows = filteredAndSortedPrices.map((p) => ({
      crop: p.crop,
      variety: p.variety,
      mandi: p.market,
      state: p.state,
      todayPrice: `₹${p.todayPrice}`,
      prevPrice: `₹${p.prevPrice}`,
      msp: `₹${p.msp}`,
      dailyChange: p.change,
      arrivals: p.arrivals,
      moisture: p.moistureAvg,
      quality: p.quality,
      lastUpdated: p.lastUpdated,
    }));

    exportToCSV(
      rows,
      [
        { key: 'crop', header: 'Commodity' },
        { key: 'variety', header: 'Variety' },
        { key: 'mandi', header: 'Mandi / APMC' },
        { key: 'state', header: 'State' },
        { key: 'todayPrice', header: "Today's Spot Rate (/qtl)" },
        { key: 'prevPrice', header: 'Prev Day Rate' },
        { key: 'msp', header: 'Govt MSP' },
        { key: 'dailyChange', header: 'Change %' },
        { key: 'arrivals', header: 'Daily Arrivals' },
        { key: 'moisture', header: 'Moisture' },
        { key: 'quality', header: 'Grade' },
        { key: 'lastUpdated', header: 'Sync Time' },
      ],
      'daily_mandi_market_prices_live.csv'
    );
    toast.success('Live Mandi prices exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Matches VendorPageHeader & CustomerPageHeader) */}
      <FarmerPageHeader
        title="Daily Mandi Market Prices"
        subtitle="Live commodity spot rate tracking across regional APMC yards, e-NAM terminals, and wholesale mandi boards."
        icon={TrendingUp}
        badge={
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-[#16A34A] animate-pulse' : 'bg-slate-400'}`} />
            <span>{isLiveActive ? 'Live e-NAM & APMC Sync' : 'Live Sync Paused'}</span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsLiveActive((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isLiveActive
                  ? 'bg-[#0F766E] text-white hover:bg-[#115E59]'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-pulse' : ''}`} />
              <span>{isLiveActive ? 'Live Ticker: ON' : 'Live Ticker: OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => simulateLiveTick(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-all duration-200 cursor-pointer shadow-xs shrink-0 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0F766E]' : 'text-[#64748B]'}`} />
              <span>Sync Live Rates</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-all duration-200 cursor-pointer shadow-xs shrink-0"
            >
              <Download className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Real-Time Live Ticker Strip (No scrollbar, continuous live stock market flow) */}
      <style>{`
        @keyframes mandiStockFlow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .mandi-ticker-track {
          display: flex;
          width: max-content;
          animation: mandiStockFlow 32s linear infinite;
        }
        .mandi-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="bg-[#0F766E] text-white rounded-2xl p-2.5 px-4 shadow-sm flex items-center justify-between gap-3 overflow-hidden relative">
        <div className="flex items-center gap-2 shrink-0 font-bold text-xs uppercase tracking-wider text-[#A3E6B4] z-20 bg-[#0F766E] pr-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>Live Ticker</span>
        </div>

        {/* Gradient edge masks for smooth fade */}
        <div className="pointer-events-none absolute left-28 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0F766E] to-transparent z-10 hidden sm:block" />
        <div className="pointer-events-none absolute right-36 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0F766E] to-transparent z-10 hidden md:block" />

        {/* Continuous Flowing Marquee Track */}
        <div className="flex-1 overflow-hidden relative py-0.5">
          <div className="mandi-ticker-track items-center gap-7 text-xs font-medium">
            {[...pricesData, ...pricesData].map((p, idx) => {
              const isUp = p.trend === 'up';
              return (
                <button
                  key={`${p.id}-${idx}`}
                  type="button"
                  onClick={() => setSelectedCropDetail(p)}
                  className="inline-flex items-center gap-2 whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                  title={`Click to view ${p.crop} market depth`}
                >
                  <span className="font-semibold text-slate-100">{p.crop.split(' ')[0]}</span>
                  <span className="font-extrabold text-white font-mono">{formatCurrency(p.todayPrice)}</span>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isUp ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'
                    }`}
                  >
                    {isUp ? '▲' : '▼'} {p.change}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-teal-200 shrink-0 hidden md:flex items-center gap-1.5 z-20 bg-[#0F766E] pl-2 font-mono">
          <Clock className="w-3 h-3 text-[#A3E6B4]" />
          <span>Synced: {lastSyncedTime.toLocaleTimeString('en-IN')}</span>
        </div>
      </div>

      {/* 4 KPI Summary Cards using FarmerStatCard matching Design System */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FarmerStatCard
          title="Average Mandi Index"
          value={`${formatCurrency(kpis.avgIndex)} / qtl`}
          subtitle="Composite across 12 commodities"
          icon={Scale}
          trend={{ value: '+2.4% Composite', direction: 'up' }}
        />
        <FarmerStatCard
          title="Top Bullish Commodity"
          value={kpis.topGainer ? kpis.topGainer.crop.split(' ')[0] : 'Turmeric'}
          subtitle={`${kpis.topGainer?.market.split(' ')[0]} Yard • ${kpis.topGainer?.changeAmount}`}
          icon={TrendingUp}
          trend={{ value: kpis.topGainer?.change || '+4.32%', direction: 'up' }}
          onClick={() => kpis.topGainer && setSelectedCropDetail(kpis.topGainer)}
        />
        <FarmerStatCard
          title="Active Mandis Tracked"
          value={`${pricesData.length} APMCs`}
          subtitle={`${kpis.gainersCount} Commodities in green`}
          icon={MapPin}
          trend={{ value: 'AP & TG', direction: 'up' }}
        />
        <FarmerStatCard
          title="Cluster Daily Arrivals"
          value={kpis.totalArrivals}
          subtitle="Peak Rabi harvest arrivals"
          icon={CheckCircle2}
        />
      </div>

      {/* Search, Filter Bar, Category Pills & View Switcher */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Search, State, Trend, Sort & View Mode */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder="Search crop, variety, mandi, district..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all"
            />
            {internalSearch && (
              <button
                type="button"
                onClick={() => setInternalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all cursor-pointer font-medium"
            >
              <option value="All">All States (AP &amp; TG)</option>
              <option value="Andhra Pradesh">Andhra Pradesh Mandis</option>
              <option value="Telangana">Telangana APMCs</option>
            </select>

            {/* Trend Filter */}
            <select
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all cursor-pointer font-medium"
            >
              <option value="All">All Price Trends</option>
              <option value="up">Gainers Only (▲)</option>
              <option value="down">Decliners Only (▼)</option>
            </select>

            {/* Commodity / Crop Category Dropdown Filter (Chilli, Turmeric, Paddy, etc.) */}
            <select
              value={selectedCropCategory}
              onChange={(e) => {
                setSelectedCropCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all cursor-pointer font-semibold"
            >
              <option value="All">All Commodities &amp; Crops</option>
              <optgroup label="Crops / Commodities">
                <option value="Chilli">Chilli (Mirchi)</option>
                <option value="Turmeric">Turmeric (Pasupu)</option>
                <option value="Paddy">Paddy (Rice / Dhan)</option>
                <option value="Groundnut">Groundnut (Verusenaga)</option>
                <option value="Cotton">Cotton (Kapas / Prathi)</option>
                <option value="Maize">Maize (Mokka Jonna)</option>
                <option value="Bengal Gram">Bengal Gram (Chana / Senagalu)</option>
                <option value="Red Gram">Red Gram (Tur Dal / Kandulu)</option>
                <option value="Sunflower">Sunflower (Produtirugudu)</option>
                <option value="Soybean">Soybean</option>
                <option value="Wheat">Wheat (Godhumalu)</option>
              </optgroup>
              <optgroup label="Broad Categories">
                <option value="Spices">Spices (Chilli, Turmeric)</option>
                <option value="Cereal">Cereal (Paddy, Maize, Wheat)</option>
                <option value="Oilseed">Oilseed (Groundnut, Sunflower, Soybean)</option>
                <option value="Pulses">Pulses (Bengal Gram, Red Gram)</option>
                <option value="Commercial">Commercial (Cotton)</option>
              </optgroup>
            </select>

            {/* View Mode Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Commodity Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9]">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            const count =
              cat === 'All Commodities'
                ? pricesData.length
                : pricesData.filter((p) => p.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedCropCategory('All');
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Compact Cards Grid View OR Detailed Table View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredAndSortedPrices.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#E2E8F0] p-8 text-xs text-[#64748B]">
              No mandi commodities match your search or filters.
            </div>
          ) : (
            paginatedPrices.map((item) => {
              const isUp = item.trend === 'up';
              const isFlashing = flashingCropId === item.id;
              const mspDiff = item.todayPrice - item.msp;
              const isAboveMsp = mspDiff >= 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-2xs hover:border-[#14B8A6] hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                    isFlashing ? (isUp ? 'ring-2 ring-emerald-400 bg-emerald-50/20' : 'ring-2 ring-rose-400 bg-rose-50/20') : ''
                  }`}
                >
                  <div>
                    {/* Compact Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xs sm:text-sm text-[#0F172A] tracking-tight truncate" title={item.crop}>
                          {item.crop}
                        </h3>
                        <span className="text-[10px] text-[#64748B] font-medium block truncate">
                          {item.variety} • {item.quality}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] shrink-0">
                        {item.category}
                      </span>
                    </div>

                    {/* Mandi & Location */}
                    <div className="flex items-center gap-1 text-[11px] text-[#64748B] mb-2 truncate">
                      <MapPin className="w-3 h-3 text-[#0F766E] shrink-0" />
                      <span className="font-semibold text-[#0F172A] truncate">{item.market}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({item.location})</span>
                    </div>

                    {/* Spot Rate & Daily Change Box */}
                    <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">
                            Today&apos;s Spot Rate
                          </span>
                          <div className="text-lg font-black text-[#0F766E] font-mono tracking-tight">
                            {formatCurrency(item.todayPrice)}
                            <span className="text-[10px] font-normal text-[#64748B] ml-1">/ qtl</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                              isUp
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{item.change}</span>
                          </span>
                          <span className="text-[9px] text-[#64748B] block mt-0.5 font-mono">
                            {item.changeAmount} vs prev
                          </span>
                        </div>
                      </div>

                      {/* Govt MSP Comparison Pill */}
                      <div className="mt-1.5 pt-1.5 border-t border-[#E2E8F0]/80 flex items-center justify-between text-[10px]">
                        <span className="text-[#64748B]">
                          MSP: <strong className="text-[#0F172A]">{formatCurrency(item.msp)}</strong>
                        </span>
                        <span
                          className={`font-bold ${
                            isAboveMsp ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isAboveMsp
                            ? `+${formatCurrency(mspDiff)} above MSP`
                            : `-${formatCurrency(Math.abs(mspDiff))} below MSP`}
                        </span>
                      </div>
                    </div>

                    {/* Compact 7-Day Sparkline mini bars */}
                    <div className="mb-2">
                      <div className="flex justify-between text-[9px] text-[#64748B] font-medium mb-1">
                        <span>Min: {formatCurrency(item.minPrice)}</span>
                        <span className="text-[#0F766E] font-bold">7D Trend</span>
                        <span>Max: {formatCurrency(item.maxPrice)}</span>
                      </div>

                      <div className="flex items-end gap-1 h-7 pt-0.5 pb-0.5 px-1 bg-slate-50 rounded-md border border-slate-100">
                        {item.history.map((val, idx) => {
                          const minH = Math.min(...item.history);
                          const maxH = Math.max(...item.history);
                          const range = maxH - minH || 1;
                          const pct = Math.max(25, Math.round(((val - minH) / range) * 85));
                          const isLast = idx === item.history.length - 1;

                          return (
                            <div
                              key={idx}
                              className="flex-1 flex flex-col items-center justify-end h-full"
                              title={`Day ${idx + 1}: ${formatCurrency(val)}`}
                            >
                              <div
                                style={{ height: `${pct}%` }}
                                className={`w-full rounded-t-xs transition-all duration-200 ${
                                  isLast
                                    ? isUp ? 'bg-[#0F766E]' : 'bg-rose-500'
                                    : 'bg-[#A3E6B4] hover:bg-[#14B8A6]'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Compact Arrivals & Moisture Strip */}
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] pb-2 border-b border-[#F1F5F9]">
                      <span>Arrivals: <strong className="text-[#0F172A]">{item.arrivals}</strong></span>
                      <span>Moist: <strong className="text-[#0F172A]">{item.moistureAvg}</strong></span>
                      <span>Bids: <strong className="text-[#0F766E]">{item.bidsCount}</strong></span>
                    </div>
                  </div>

                  {/* Compact Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCropDetail(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1 h-7.5 rounded-lg text-[11px] font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#0F766E] hover:text-white hover:border-[#0F766E] transition-all cursor-pointer shadow-2xs"
                    >
                      <Info className="w-3 h-3" />
                      <span>Market Depth</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        toast.success(`Redirecting to sell ${item.crop} at Mandi rate of ${formatCurrency(item.todayPrice)}.`);
                        if (navigateTo) navigateTo('sell');
                      }}
                      className="inline-flex items-center justify-center gap-1 h-7.5 px-3 rounded-lg text-[11px] font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all cursor-pointer shadow-2xs"
                      title="Create a sale order at this rate"
                    >
                      <ShoppingBag className="w-3 h-3 stroke-[2]" />
                      <span>Sell</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Commodity &amp; Variety</th>
                  <th className="py-3.5 px-4">Mandi Yard / Location</th>
                  <th className="py-3.5 px-4">Today&apos;s Rate</th>
                  <th className="py-3.5 px-4">Daily Trend</th>
                  <th className="py-3.5 px-4">Govt MSP</th>
                  <th className="py-3.5 px-4">Min / Max Range</th>
                  <th className="py-3.5 px-4">Arrivals</th>
                  <th className="py-3.5 px-4">Quality / Moisture</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredAndSortedPrices.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-xs text-[#64748B]">
                      No mandi commodities match your search or filters.
                    </td>
                  </tr>
                ) : (
                  paginatedPrices.map((item) => {
                    const isUp = item.trend === 'up';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#CCFBF1]/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <strong className="text-sm text-[#0F172A] block">{item.crop}</strong>
                          <span className="text-[11px] text-[#64748B]">{item.variety} • {item.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#0F172A] block">{item.market}</span>
                          <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#0F766E]" /> {item.location}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <strong className="text-sm font-extrabold text-[#0F766E] block font-mono">
                            {formatCurrency(item.todayPrice)}
                          </strong>
                          <span className="text-[10px] text-[#64748B]">per quintal</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isUp
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isUp ? '▲' : '▼'} {item.change}
                          </span>
                          <span className="text-[10px] text-[#64748B] block mt-0.5">{item.changeAmount}</span>
                        </td>
                        <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                          <span className="font-semibold text-[#0F172A]">{formatCurrency(item.msp)}</span>
                          <span className="text-[10px] block text-emerald-700 font-medium">
                            +{formatCurrency(item.todayPrice - item.msp)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#64748B] whitespace-nowrap text-[11px]">
                          {formatCurrency(item.minPrice)} – {formatCurrency(item.maxPrice)}
                        </td>
                        <td className="py-3 px-4 text-[#0F172A] font-semibold whitespace-nowrap">
                          {item.arrivals}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-[#0F172A] font-medium">{item.quality}</div>
                          <div className="text-[10px] text-[#64748B]">Moisture: {item.moistureAvg}</div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCropDetail(item)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Depth
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toast.success(`Proceeding to sell ${item.crop} at ${formatCurrency(item.todayPrice)}.`);
                                if (navigateTo) navigateTo('sell');
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer"
                            >
                              Sell
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredAndSortedPrices.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 sm:px-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="text-xs text-[#64748B]">
            Showing <strong className="text-[#0F172A]">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-[#0F172A]">{Math.min(currentPage * pageSize, filteredAndSortedPrices.length)}</strong> of{' '}
            <strong className="text-[#0F172A]">{filteredAndSortedPrices.length}</strong> commodities
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Records per page selector */}
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mr-2">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A] cursor-pointer"
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={16}>16</option>
              </select>
            </div>

            {/* Previous Button */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Crop Interactive Depth & Historical Chart Modal */}
      {selectedCropDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between gap-3 bg-[#F8FAFC]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
                    {selectedCropDetail.category} Mandi Tracker
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#CCFBF1] text-[#0F766E]">
                    Live e-NAM Verified
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#0F766E] mt-0.5">
                  {selectedCropDetail.crop}
                </h3>
                <span className="text-xs text-[#64748B]">
                  {selectedCropDetail.market} • {selectedCropDetail.location}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCropDetail(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Highlight Price & MSP comparison */}
              <div className="bg-linear-to-br from-[#CCFBF1]/30 to-[#F0FDFA] p-4 rounded-xl border border-[#14B8A6]/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">
                    Today&apos;s Live Spot Price
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F766E] tracking-tight mt-0.5 font-mono">
                    {formatCurrency(selectedCropDetail.todayPrice)}
                    <span className="text-xs font-medium text-[#64748B] ml-1">/ quintal</span>
                  </div>
                  <span className="text-xs text-[#16A34A] font-bold mt-1 block">
                    {selectedCropDetail.change} ({selectedCropDetail.changeAmount}) vs yesterday
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Minimum Support Price (MSP)
                  </span>
                  <div className="text-base font-extrabold text-[#0F172A] mt-0.5">
                    {formatCurrency(selectedCropDetail.msp)}
                  </div>
                  <span className="text-xs text-emerald-700 font-bold block mt-1">
                    +{formatCurrency(selectedCropDetail.todayPrice - selectedCropDetail.msp)} (Above MSP)
                  </span>
                </div>
              </div>

              {/* 7-Day Interactive Price Movement Bar Chart */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">
                  <span>Recent 7-Day Price Movement (₹ / qtl)</span>
                  <span className="text-[#0F766E]">High: {formatCurrency(selectedCropDetail.maxPrice)}</span>
                </div>

                <div className="flex items-end gap-2.5 h-32 pt-2 pb-2 px-3 bg-slate-50 rounded-xl border border-slate-200">
                  {selectedCropDetail.history.map((val, idx) => {
                    const minH = Math.min(...selectedCropDetail.history);
                    const maxH = Math.max(...selectedCropDetail.history);
                    const range = maxH - minH || 1;
                    const pct = Math.max(25, Math.round(((val - minH) / range) * 85));
                    const isToday = idx === selectedCropDetail.history.length - 1;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full gap-1 group/bar"
                      >
                        <span className="text-[10px] font-bold text-[#0F172A] opacity-90">
                          {formatCurrency(val)}
                        </span>
                        <div
                          style={{ height: `${pct}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isToday ? 'bg-[#0F766E]' : 'bg-[#A3E6B4] hover:bg-[#14B8A6]'
                          }`}
                        />
                        <span className="text-[10px] text-[#64748B]">
                          {isToday ? 'Today' : `D-${6 - idx}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mandi Depth & Inspection Metrics Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                  Mandi Trading Depth &amp; Quality Specifications
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B] block">Daily Arrivals</span>
                    <strong className="text-xs font-bold text-[#0F172A]">{selectedCropDetail.arrivals}</strong>
                  </div>
                  <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B] block">Moisture Test</span>
                    <strong className="text-xs font-bold text-[#0F172A]">{selectedCropDetail.moistureAvg}</strong>
                  </div>
                  <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B] block">Active Bidders</span>
                    <strong className="text-xs font-bold text-[#0F766E]">{selectedCropDetail.bidsCount} Traders</strong>
                  </div>
                  <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B] block">Market Yard</span>
                    <strong className="text-xs font-bold text-[#0F172A] truncate block">{selectedCropDetail.district}</strong>
                  </div>
                </div>
              </div>

              {/* Price Alert Simulation Box */}
              <div className="bg-[#F0FDF4] p-3 rounded-xl border border-[#BBF7D0] flex items-center justify-between text-xs text-[#166534]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span>Receive WhatsApp/SMS alert if rate exceeds <strong>{formatCurrency(selectedCropDetail.todayPrice + 50)}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success(`Price alert activated for ${selectedCropDetail.crop} at ${formatCurrency(selectedCropDetail.todayPrice + 50)}/qtl.`)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer"
                >
                  Set Alert
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const rows = [
                    {
                      crop: selectedCropDetail.crop,
                      mandi: selectedCropDetail.market,
                      todayPrice: selectedCropDetail.todayPrice,
                      minPrice: selectedCropDetail.minPrice,
                      maxPrice: selectedCropDetail.maxPrice,
                      msp: selectedCropDetail.msp,
                      arrivals: selectedCropDetail.arrivals,
                    },
                  ];
                  exportToCSV(rows, [
                    { key: 'crop', header: 'Crop' },
                    { key: 'mandi', header: 'Mandi' },
                    { key: 'todayPrice', header: 'Spot Price' },
                    { key: 'minPrice', header: 'Min Price' },
                    { key: 'maxPrice', header: 'Max Price' },
                    { key: 'msp', header: 'MSP' },
                    { key: 'arrivals', header: 'Arrivals' },
                  ], `mandi_${selectedCropDetail.id}_report.csv`);
                  toast.success('Mandi depth report exported.');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2]" />
                <span>Export Audit</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedCropDetail;
                    setSelectedCropDetail(null);
                    toast.success(`Opening Sell Products with ${c.crop} at ${formatCurrency(c.todayPrice)}.`);
                    if (navigateTo) navigateTo('sell');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Sell {selectedCropDetail.crop.split(' ')[0]} at this Rate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCropDetail(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
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
