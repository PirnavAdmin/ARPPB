import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { CROP_OPTIONS } from '../../../utils/constants';
import { formatNumber, formatCurrency } from '../../../utils/formatCurrency';
import { BRAND_THEME } from '../../../config/theme';

export function RawMaterialChart({ inventory = [] }) {
  const navigate = useNavigate();

  const cropData = useMemo(() => {
    return CROP_OPTIONS.map((crop, idx) => {
      const matching = inventory.filter(
        (b) => b.cropName.toLowerCase() === crop.toLowerCase()
      );
      const available = matching.reduce((sum, b) => sum + Number(b.availableQuantity || 0), 0);
      const purchased = matching.reduce((sum, b) => sum + Number(b.purchasedQuantity || 0), 0);
      const processed = matching.reduce((sum, b) => sum + Number(b.processedQuantity || 0), 0);
      const stockValue = matching.reduce(
        (sum, b) => sum + Number(b.availableQuantity || 0) * Number(b.averageCost || 0),
        0
      );

      return {
        crop,
        availableQuantity: Math.round(available * 100) / 100,
        purchasedQuantity: Math.round(purchased * 100) / 100,
        processedQuantity: Math.round(processed * 100) / 100,
        stockValue,
        batchesCount: matching.length,
        fill: BRAND_THEME.chartPalette[idx % BRAND_THEME.chartPalette.length],
      };
    });
  }, [inventory]);

  const handleCropClick = (entry) => {
    if (entry && entry.crop) {
      navigate(`/vendor/inventory?crop=${encodeURIComponent(entry.crop)}`);
    }
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-brand-primary">
              Raw Material Inventory by Crop
            </h3>
            <p className="text-xs text-brand-muted">
              Click any crop bar or pill to open filtered Raw Material Inventory
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-brand-light text-brand-primary text-xs font-bold">
            8 Crop Categories
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cropData}
              margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload[0]) {
                  handleCropClick(state.activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="crop" tick={{ fontSize: 11, fill: '#0F172A' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(v) => `${v} Q`}
              />
              <Tooltip
                cursor={{ fill: '#CCFBF1', opacity: 0.35 }}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val, _name, props) => [
                  `${formatNumber(val)} Quintal (${formatCurrency(props.payload.stockValue)})`,
                  'Available Stock',
                ]}
              />
              <Bar
                dataKey="availableQuantity"
                name="Available Stock (Quintal)"
                radius={[6, 6, 0, 0]}
                className="cursor-pointer"
              >
                {cropData.map((entry) => (
                  <Cell key={entry.crop} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Crop Pills */}
        <div className="mt-4 pt-3 border-t border-brand-border flex flex-wrap gap-2">
          {cropData.map((c) => (
            <button
              key={c.crop}
              type="button"
              onClick={() => handleCropClick(c)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-background border border-brand-border hover:bg-brand-light hover:border-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-brand-primary" />
              <span>{c.crop}:</span>
              <strong className="text-brand-primary">{formatNumber(c.availableQuantity)} Qtl</strong>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RawMaterialChart;

