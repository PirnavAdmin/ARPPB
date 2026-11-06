import { useState, useMemo } from 'react';
import {
  PackageCheck,
  Plus,
  Eye,
  Edit3,
  Power,
  History,
  SlidersHorizontal,
  AlertTriangle,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatCard from '../VendorStatCard';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorModal from '../VendorModal';
import VendorExportMenu from '../VendorExportMenu';
import ProductForm from './ProductForm';
import UpdateProductStock from './UpdateProductStock';
import ProductDetails from './ProductDetails';
import ProductSalesHistory from './ProductSalesHistory';
import {
  FINISHED_PRODUCT_CATEGORIES,
  CROP_OPTIONS,
} from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { generateNextId } from '../../../utils/generateTransactionId';

export function FinishedProducts() {
  const {
    products,
    productBatches,
    sales,
    addFinishedProduct,
    updateFinishedProduct,
    adjustFinishedProductStock,
  } = useVendor();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [rawFilter, setRawFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [stockUpdateProduct, setStockUpdateProduct] = useState(null);
  const [salesHistoryProduct, setSalesHistoryProduct] = useState(null);

  const summary = useMemo(() => {
    const totalTypes = products.length;
    const totalStockUnits = products.reduce(
      (s, p) => s + Number(p.availableQuantity || 0),
      0
    );
    const totalSoldUnits = products.reduce(
      (s, p) => s + Number(p.soldQuantity || 0),
      0
    );
    const lowStockCount = products.filter(
      (p) => Number(p.availableQuantity || 0) <= Number(p.minimumStockLevel || 15)
    ).length;

    return {
      totalTypes,
      totalStockUnits,
      totalSoldUnits,
      lowStockCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (rawFilter !== 'All' && p.sourceRawMaterial !== rawFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (q) {
        const match =
          p.id.toLowerCase().includes(q) ||
          p.productName.toLowerCase().includes(q) ||
          (p.brandName || '').toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [products, debouncedSearch, categoryFilter, rawFilter, statusFilter]);

  const nextProductId = useMemo(
    () => generateNextId('PROD-', products, 'id', 4),
    [products]
  );

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setRawFilter('All');
    setStatusFilter('All');
  };

  const columns = [
    {
      key: 'imageUrl',
      header: 'Image',
      render: (row) => (
        <div className="w-9 h-9 rounded-lg bg-brand-light text-brand-primary flex items-center justify-center overflow-hidden">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={row.productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <PackageCheck className="w-4 h-4" />
          )}
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Product ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewingProduct(row)}
          className="font-mono font-bold text-brand-primary hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'productName',
      header: 'Product Name',
      sortable: true,
      render: (row) => <span className="font-bold text-brand-text">{row.productName}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => <span className="text-xs">{row.category}</span>,
    },
    {
      key: 'sourceRawMaterial',
      header: 'Source Raw Material',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-brand-light/70 text-brand-primary text-xs font-semibold">
          {row.sourceRawMaterial}
        </span>
      ),
    },
    {
      key: 'brandName',
      header: 'Brand Name',
      render: (row) => <span className="text-xs font-medium">{row.brandName}</span>,
    },
    {
      key: 'packagingType',
      header: 'Packaging',
      render: (row) => (
        <div>
          <p className="text-xs font-medium">{row.packagingType}</p>
          <p className="text-[11px] text-brand-muted">{row.packageSize}</p>
        </div>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Available Qty',
      align: 'right',
      sortable: true,
      render: (row) => {
        const isLow =
          Number(row.availableQuantity || 0) <= Number(row.minimumStockLevel || 15);
        return (
          <div>
            <span
              className={`font-bold ${
                isLow ? 'text-brand-warning' : 'text-brand-primary'
              }`}
            >
              {formatNumber(row.availableQuantity)} {row.unit}
            </span>
            {isLow && (
              <span className="block text-[10px] text-brand-warning font-semibold">
                Low Stock
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'manufacturingDate',
      header: 'Mfg / Expiry',
      render: (row) => (
        <div className="text-xs whitespace-nowrap">
          <p>Mfg: {formatDate(row.manufacturingDate)}</p>
          <p className="text-brand-muted">Exp: {formatDate(row.expiryDate)}</p>
        </div>
      ),
    },
    {
      key: 'productionCost',
      header: 'Production Cost',
      align: 'right',
      sortable: true,
      render: (row) => formatCurrency(row.productionCost),
    },
    {
      key: 'sellingPrice',
      header: 'Selling Price',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-primary">
          {formatCurrency(row.sellingPrice)}
        </span>
      ),
    },
    {
      key: 'profitMargin',
      header: 'Profit Margin',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-success">
          {formatNumber(row.profitMargin)}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <VendorStatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewingProduct(row)}
            title="View Product & Batches"
            className="p-1.5 rounded-lg bg-brand-light/70 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(row);
              setIsFormOpen(true);
            }}
            title="Edit Product"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setStockUpdateProduct(row)}
            title="Update Stock"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSalesHistoryProduct(row)}
            title="View Sales History"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              updateFinishedProduct(row.id, {
                status: row.status === 'Active' ? 'Inactive' : 'Active',
              })
            }
            title={row.status === 'Active' ? 'Deactivate Product' : 'Activate Product'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              row.status === 'Active'
                ? 'bg-brand-error-light/60 border-brand-error/20 text-brand-error hover:bg-brand-error hover:text-white'
                : 'bg-brand-success-light/60 border-brand-success/20 text-brand-success hover:bg-brand-success hover:text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Finished Products Inventory"
        subtitle="Manage processed agricultural products, manufacturing batches, production costs, selling prices, and profit margins."
        icon={PackageCheck}
        actions={
          <>
            <VendorExportMenu
              data={filteredProducts}
              columns={columns.filter((c) => c.key !== 'actions' && c.key !== 'imageUrl')}
              filename="finished_products.csv"
            />
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </>
        }
      />

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VendorStatCard
          title="Total Product Types"
          value={formatNumber(summary.totalTypes, 0)}
          description={`${productBatches.length} active manufacturing batches`}
          icon={Layers}
        />
        <VendorStatCard
          title="Total Finished Stock"
          value={formatNumber(summary.totalStockUnits)}
          description="Available across Qtl, Kg & Litre"
          icon={PackageCheck}
          highlight
        />
        <VendorStatCard
          title="Total Sold Quantity"
          value={formatNumber(summary.totalSoldUnits)}
          description="Dispatched to wholesale & retail"
          icon={TrendingUp}
        />
        <VendorStatCard
          title="Low Stock Products"
          value={formatNumber(summary.lowStockCount, 0)}
          description="Below minimum stock threshold"
          icon={AlertTriangle}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <VendorSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by Product ID, Name, Brand, or Category..."
        />
        <VendorFilters
          filters={[
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: FINISHED_PRODUCT_CATEGORIES,
            },
            {
              key: 'raw',
              label: 'Source Raw Material',
              value: rawFilter,
              onChange: setRawFilter,
              options: CROP_OPTIONS,
            },
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: ['Active', 'Inactive'],
            },
          ]}
          onReset={resetFilters}
        />
      </div>

      {/* Product Listing Table */}
      <VendorDataTable
        columns={columns}
        data={filteredProducts}
        onResetFilters={resetFilters}
      />

      {/* Add / Edit Product Modal */}
      <VendorModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        title={
          editingProduct
            ? `Edit Finished Product – ${editingProduct.id}`
            : 'Add New Finished Product'
        }
        subtitle="Configure finished product specifications, packaging, minimum stock level, and selling price."
        size="lg"
      >
        <ProductForm
          initialData={editingProduct}
          nextProductId={nextProductId}
          onSubmit={(data) => {
            if (editingProduct) {
              updateFinishedProduct(editingProduct.id, data);
            } else {
              addFinishedProduct(data);
            }
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
        />
      </VendorModal>

      {/* Update Stock Modal */}
      <VendorModal
        isOpen={Boolean(stockUpdateProduct)}
        onClose={() => setStockUpdateProduct(null)}
        title={`Update Finished Stock – ${stockUpdateProduct?.productName || ''}`}
        subtitle="Record an audited batch stock adjustment with mandatory reason."
        size="md"
      >
        <UpdateProductStock
          product={stockUpdateProduct}
          batches={productBatches}
          onAdjust={(payload) => {
            const res = adjustFinishedProductStock(payload);
            if (res.success) setStockUpdateProduct(null);
            return res;
          }}
          onCancel={() => setStockUpdateProduct(null)}
        />
      </VendorModal>

      {/* Product Details Modal */}
      <VendorModal
        isOpen={Boolean(viewingProduct)}
        onClose={() => setViewingProduct(null)}
        title={`Product Details – ${viewingProduct?.productName || ''}`}
        subtitle={`Product ID: ${viewingProduct?.id || ''} • ${viewingProduct?.brandName || ''}`}
        size="xl"
      >
        <ProductDetails
          product={
            viewingProduct
              ? products.find((p) => p.id === viewingProduct.id) || viewingProduct
              : null
          }
          batches={productBatches}
          sales={sales}
          onClose={() => setViewingProduct(null)}
          onEdit={(prod) => {
            setViewingProduct(null);
            setEditingProduct(prod);
            setIsFormOpen(true);
          }}
          onOpenStockUpdate={(prod) => {
            setViewingProduct(null);
            setStockUpdateProduct(prod);
          }}
        />
      </VendorModal>

      {/* Product Sales History Modal */}
      <VendorModal
        isOpen={Boolean(salesHistoryProduct)}
        onClose={() => setSalesHistoryProduct(null)}
        title={`Sales History – ${salesHistoryProduct?.productName || ''}`}
        subtitle={`All customer sales orders containing ${salesHistoryProduct?.id || ''}`}
        size="xl"
      >
        <ProductSalesHistory product={salesHistoryProduct} sales={sales} />
      </VendorModal>
    </div>
  );
}

export default FinishedProducts;

