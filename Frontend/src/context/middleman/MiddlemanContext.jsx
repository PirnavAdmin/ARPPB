import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MiddlemanContext } from './context';
import { INITIAL_PROFILE } from '../../data/mock/middleman/profileData';
import { INITIAL_FARMERS } from '../../data/mock/middleman/farmerData';
import { INITIAL_VENDORS } from '../../data/mock/middleman/vendorData';
import { INITIAL_CUSTOMERS } from '../../data/mock/middleman/customerData';
import { INITIAL_PURCHASES } from '../../data/mock/middleman/purchaseData';
import { INITIAL_INVENTORY_BATCHES } from '../../data/mock/middleman/inventoryData';
import { INITIAL_VENDOR_SALES, INITIAL_CUSTOMER_SALES } from '../../data/mock/middleman/salesData';
import { INITIAL_CONFIRMATIONS } from '../../data/mock/middleman/confirmationData';
import { INITIAL_LEDGER_ENTRIES } from '../../data/mock/middleman/ledgerData';
import { INITIAL_NOTIFICATIONS } from '../../data/mock/middleman/notificationData';
import { generateId } from '../../utils/middleman/transactionHelpers';
import { allocateInventoryFIFO, calculateGrossProfit, calculateOutstandingPosition } from '../../utils/middleman/calculations';

const STORAGE_KEY = 'agriconnect_middleman_state_v1';

export const MiddlemanProvider = ({ children }) => {
  // Load state from localStorage or initialize from mock data
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_profile`);
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  const [farmers, setFarmers] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_farmers`);
      return saved ? JSON.parse(saved) : INITIAL_FARMERS;
    } catch {
      return INITIAL_FARMERS;
    }
  });

  const [vendors, setVendors] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_vendors`);
      return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    } catch {
      return INITIAL_VENDORS;
    }
  });

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [purchases, setPurchases] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_purchases`);
      return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
    } catch {
      return INITIAL_PURCHASES;
    }
  });

  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_inventory`);
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY_BATCHES;
    } catch {
      return INITIAL_INVENTORY_BATCHES;
    }
  });

  const [vendorSales, setVendorSales] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_vendor_sales`);
      return saved ? JSON.parse(saved) : INITIAL_VENDOR_SALES;
    } catch {
      return INITIAL_VENDOR_SALES;
    }
  });

  const [customerSales, setCustomerSales] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_customer_sales`);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_SALES;
    } catch {
      return INITIAL_CUSTOMER_SALES;
    }
  });

  const [confirmations, setConfirmations] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_confirmations`);
      return saved ? JSON.parse(saved) : INITIAL_CONFIRMATIONS;
    } catch {
      return INITIAL_CONFIRMATIONS;
    }
  });

  const [ledger, setLedger] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ledger`);
      return saved ? JSON.parse(saved) : INITIAL_LEDGER_ENTRIES;
    } catch {
      return INITIAL_LEDGER_ENTRIES;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
      localStorage.setItem(`${STORAGE_KEY}_farmers`, JSON.stringify(farmers));
      localStorage.setItem(`${STORAGE_KEY}_vendors`, JSON.stringify(vendors));
      localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
      localStorage.setItem(`${STORAGE_KEY}_purchases`, JSON.stringify(purchases));
      localStorage.setItem(`${STORAGE_KEY}_inventory`, JSON.stringify(inventory));
      localStorage.setItem(`${STORAGE_KEY}_vendor_sales`, JSON.stringify(vendorSales));
      localStorage.setItem(`${STORAGE_KEY}_customer_sales`, JSON.stringify(customerSales));
      localStorage.setItem(`${STORAGE_KEY}_confirmations`, JSON.stringify(confirmations));
      localStorage.setItem(`${STORAGE_KEY}_ledger`, JSON.stringify(ledger));
      localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
    } catch {
      // ignore quota errors
    }
  }, [profile, farmers, vendors, customers, purchases, inventory, vendorSales, customerSales, confirmations, ledger, notifications]);

  // Notifications helper
  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: generateId('NOT'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isRead: false,
      priority: 'medium',
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  // Profile actions
  const updateProfile = useCallback((data) => {
    setProfile((prev) => ({ ...prev, ...data }));
    addNotification({
      title: 'Business Profile Updated',
      description: 'Your Middleman business details were saved successfully.',
      category: 'Transaction Completed',
      actionUrl: '/middleman/profile',
    });
  }, [addNotification]);

  // Farmer actions
  const addFarmer = useCallback((data) => {
    const newFarmer = {
      farmerId: generateId('FAR'),
      totalPurchases: 0,
      totalQuantityPurchased: 0,
      totalPurchaseValue: 0,
      outstandingPayables: 0,
      pendingConfirmations: 0,
      status: 'Active',
      ...data,
    };
    setFarmers((prev) => [newFarmer, ...prev]);
    addNotification({
      title: 'Farmer Registered',
      description: `Farmer ${newFarmer.name} from ${newFarmer.village} was added.`,
      category: 'Transaction Completed',
      relatedId: newFarmer.farmerId,
      partyName: newFarmer.name,
      actionUrl: '/middleman/farmers',
    });
    return newFarmer;
  }, [addNotification]);

  const updateFarmer = useCallback((id, data) => {
    setFarmers((prev) => prev.map((f) => (f.farmerId === id ? { ...f, ...data } : f)));
  }, []);

  // Vendor actions
  const addVendor = useCallback((data) => {
    const newVendor = {
      vendorId: generateId('VEN'),
      totalPurchases: 0,
      totalPurchaseValue: 0,
      outstandingReceivables: 0,
      status: 'Active',
      ...data,
    };
    setVendors((prev) => [newVendor, ...prev]);
    addNotification({
      title: 'Vendor Registered',
      description: `Vendor ${newVendor.businessName} was added.`,
      category: 'Transaction Completed',
      relatedId: newVendor.vendorId,
      partyName: newVendor.businessName,
      actionUrl: '/middleman/vendors',
    });
    return newVendor;
  }, [addNotification]);

  const updateVendor = useCallback((id, data) => {
    setVendors((prev) => prev.map((v) => (v.vendorId === id ? { ...v, ...data } : v)));
  }, []);

  // Customer actions
  const addCustomer = useCallback((data) => {
    const newCustomer = {
      customerId: generateId('CUS'),
      totalPurchases: 0,
      totalPurchaseValue: 0,
      outstandingReceivables: 0,
      status: 'Active',
      ...data,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    addNotification({
      title: 'Customer Registered',
      description: `Customer ${newCustomer.name} was added.`,
      category: 'Transaction Completed',
      relatedId: newCustomer.customerId,
      partyName: newCustomer.name,
      actionUrl: '/middleman/customers',
    });
    return newCustomer;
  }, [addNotification]);

  const updateCustomer = useCallback((id, data) => {
    setCustomers((prev) => prev.map((c) => (c.customerId === id ? { ...c, ...data } : c)));
  }, []);

  // Purchase Actions
  const createPurchase = useCallback((data, isDraft = false) => {
    const purchaseId = generateId('PUR');
    const newPurchase = {
      purchaseId,
      ...data,
      otpStatus: isDraft ? 'Draft' : 'Pending',
      status: isDraft ? 'Draft' : 'Pending Confirmation',
      confirmationDate: null,
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    if (!isDraft) {
      // Create pending confirmation record
      const confId = generateId('CONF-F');
      const confirmationItem = {
        confirmationId: confId,
        transactionId: purchaseId,
        transactionType: 'Farmer Purchase',
        partyType: 'Farmer',
        partyId: data.farmerId,
        partyName: data.farmerName,
        partyMobile: data.farmerMobile,
        crop: data.cropName,
        variety: data.variety || 'Standard',
        quantity: data.quantity,
        unit: data.unit || 'Quintal',
        pricePerUnit: data.rate,
        additionalCharges: data.additionalCharges || 0,
        transactionAmount: data.totalAmount,
        otpStatus: 'Pending',
        requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        expiryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        confirmationDate: null,
        expectedPaymentDate: data.expectedPaymentDate,
        notes: data.notes || '',
      };
      setConfirmations((prev) => [confirmationItem, ...prev]);

      addNotification({
        title: 'Farmer Purchase OTP Sent',
        description: `Pending OTP confirmation from ${data.farmerName} for ${data.quantity} ${data.unit || 'Quintal'} ${data.cropName}.`,
        category: 'Farmer Purchase Confirmation',
        relatedId: purchaseId,
        partyName: data.farmerName,
        actionUrl: '/middleman/confirmations',
      });
    }

    return newPurchase;
  }, [addNotification]);

  // Vendor Sale Actions
  const createVendorSale = useCallback((data, isDraft = false) => {
    const saleId = generateId('SAL');
    const newSale = {
      saleId,
      ...data,
      otpStatus: isDraft ? 'Draft' : 'Pending',
      status: isDraft ? 'Draft' : 'Pending Confirmation',
      confirmationDate: null,
      cogs: 0,
    };

    setVendorSales((prev) => [newSale, ...prev]);

    if (!isDraft) {
      const confId = generateId('CONF-V');
      const confirmationItem = {
        confirmationId: confId,
        transactionId: saleId,
        transactionType: 'Vendor Sale',
        partyType: 'Vendor',
        partyId: data.vendorId,
        partyName: data.businessName,
        partyMobile: data.mobile,
        crop: data.cropName,
        variety: data.variety || 'Standard',
        quantity: data.quantity,
        unit: data.unit || 'Quintal',
        pricePerUnit: data.rate,
        additionalCharges: data.additionalCharges || 0,
        transactionAmount: data.totalAmount,
        otpStatus: 'Pending',
        requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        expiryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        confirmationDate: null,
        expectedPaymentDate: data.expectedPaymentDate,
        notes: data.notes || '',
      };
      setConfirmations((prev) => [confirmationItem, ...prev]);

      addNotification({
        title: 'Vendor Sale OTP Sent',
        description: `Pending OTP confirmation from ${data.businessName} for ${data.quantity} ${data.unit || 'Quintal'} ${data.cropName}.`,
        category: 'Vendor Purchase Confirmation',
        relatedId: saleId,
        partyName: data.businessName,
        actionUrl: '/middleman/confirmations',
      });
    }

    return newSale;
  }, [addNotification]);

  // Customer Sale Actions
  const createCustomerSale = useCallback((data, isDraft = false) => {
    const saleId = generateId('CUS-SAL');
    const newSale = {
      saleId,
      ...data,
      otpStatus: isDraft ? 'Draft' : 'Pending',
      status: isDraft ? 'Draft' : 'Pending Confirmation',
      confirmationDate: null,
      cogs: 0,
    };

    setCustomerSales((prev) => [newSale, ...prev]);

    if (!isDraft) {
      const confId = generateId('CONF-C');
      const confirmationItem = {
        confirmationId: confId,
        transactionId: saleId,
        transactionType: 'Customer Sale',
        partyType: 'Customer',
        partyId: data.customerId,
        partyName: data.customerName,
        partyMobile: data.mobile,
        crop: data.cropName,
        variety: data.variety || 'Standard',
        quantity: data.quantity,
        unit: data.unit || 'Quintal',
        pricePerUnit: data.price,
        additionalCharges: data.deliveryCharges || 0,
        transactionAmount: data.finalAmount,
        otpStatus: 'Pending',
        requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        expiryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        confirmationDate: null,
        expectedPaymentDate: data.expectedPaymentDate,
        notes: data.notes || '',
      };
      setConfirmations((prev) => [confirmationItem, ...prev]);

      addNotification({
        title: 'Customer Sale OTP Sent',
        description: `Pending OTP confirmation from ${data.customerName} for ${data.quantity} ${data.unit || 'Quintal'} ${data.cropName}.`,
        category: 'Customer Purchase Confirmation',
        relatedId: saleId,
        partyName: data.customerName,
        actionUrl: '/middleman/confirmations',
      });
    }

    return newSale;
  }, [addNotification]);

  // Centralized OTP Confirmation Action (Simulated Verified Interaction)
  const confirmTransaction = useCallback((confirmationId) => {
    const confItem = confirmations.find((c) => c.confirmationId === confirmationId);
    if (!confItem || confItem.otpStatus === 'Confirmed') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // 1. Update confirmation status
    setConfirmations((prev) =>
      prev.map((c) =>
        c.confirmationId === confirmationId
          ? { ...c, otpStatus: 'Confirmed', confirmationDate: now }
          : c
      )
    );

    // 2. Handle Farmer Purchase Confirmation -> Adds stock to Inventory & records in Ledger
    if (confItem.transactionType === 'Farmer Purchase') {
      const purchase = purchases.find((p) => p.purchaseId === confItem.transactionId);
      if (purchase) {
        // Update purchase record
        setPurchases((prev) =>
          prev.map((p) =>
            p.purchaseId === purchase.purchaseId
              ? { ...p, otpStatus: 'Confirmed', status: 'Completed', confirmationDate: now }
              : p
          )
        );

        // Create new Inventory Batch
        const stockId = generateId('STK');
        const newBatch = {
          stockId,
          purchaseId: purchase.purchaseId,
          farmerId: purchase.farmerId,
          farmerName: purchase.farmerName,
          cropName: purchase.cropName,
          variety: purchase.variety || 'Standard',
          unit: purchase.unit || 'Quintal',
          purchaseDate: purchase.purchaseDate || now.slice(0, 10),
          purchasedQuantity: Number(purchase.quantity),
          soldQuantity: 0,
          availableQuantity: Number(purchase.quantity),
          purchaseRate: Number(purchase.rate),
          allocatedCharges: Number(purchase.additionalCharges || 0),
          averageCost: Number(purchase.averageCostPerUnit || purchase.rate),
          quality: purchase.quality || 'Grade A',
          status: 'In Stock',
          godownLocation: purchase.pickupLocation || 'Main Yard Godown',
        };
        setInventory((prev) => [newBatch, ...prev]);

        // Update Farmer stats
        setFarmers((prev) =>
          prev.map((f) =>
            f.farmerId === purchase.farmerId
              ? {
                  ...f,
                  totalPurchases: (f.totalPurchases || 0) + 1,
                  totalQuantityPurchased: (f.totalQuantityPurchased || 0) + Number(purchase.quantity),
                  totalPurchaseValue: (f.totalPurchaseValue || 0) + Number(purchase.totalAmount),
                  outstandingPayables: (f.outstandingPayables || 0) + Number(purchase.totalAmount),
                }
              : f
          )
        );

        // Add Ledger entry (Payable to Farmer)
        const newLedger = {
          ledgerId: generateId('LED'),
          date: purchase.purchaseDate || now.slice(0, 10),
          transactionId: purchase.purchaseId,
          description: `Purchase of ${purchase.quantity} ${purchase.unit || 'Qtl'} ${purchase.cropName} from ${purchase.farmerName}`,
          partyId: purchase.farmerId,
          partyName: purchase.farmerName,
          partyCategory: 'Farmer',
          debit: 0,
          credit: Number(purchase.totalAmount),
          runningBalance: 0,
          expectedPaymentDate: purchase.expectedPaymentDate,
          status: 'Pending',
          settledAmount: 0,
          outstandingAmount: Number(purchase.totalAmount),
        };
        setLedger((prev) => [newLedger, ...prev]);

        addNotification({
          title: 'Purchase Confirmed & Stock Added',
          description: `Batch ${stockId} added to inventory: ${purchase.quantity} ${purchase.unit || 'Qtl'} ${purchase.cropName}.`,
          category: 'Inventory Updated',
          relatedId: stockId,
          partyName: purchase.farmerName,
          actionUrl: '/middleman/inventory',
        });
      }
    }

    // 3. Handle Vendor Sale Confirmation -> Deducts stock via FIFO & records in Ledger
    if (confItem.transactionType === 'Vendor Sale') {
      const sale = vendorSales.find((s) => s.saleId === confItem.transactionId);
      if (sale) {
        // Allocate stock from inventory batches via FIFO
        const cropBatches = inventory.filter((b) => b.cropName === sale.cropName);
        const { allocatedBatches, cogs } = allocateInventoryFIFO(cropBatches, sale.quantity);

        // Deduct from batches
        setInventory((prev) =>
          prev.map((batch) => {
            const allocation = allocatedBatches.find((a) => a.stockId === batch.stockId);
            if (allocation) {
              const newSold = (batch.soldQuantity || 0) + allocation.allocatedQuantity;
              const newAvail = Math.max(0, (batch.purchasedQuantity || 0) - newSold);
              return {
                ...batch,
                soldQuantity: newSold,
                availableQuantity: newAvail,
                status: newAvail <= 0 ? 'Exhausted' : newAvail <= 30 ? 'Low Stock' : 'In Stock',
              };
            }
            return batch;
          })
        );

        // Update sale record with confirmed status & calculated COGS
        setVendorSales((prev) =>
          prev.map((s) =>
            s.saleId === sale.saleId
              ? {
                  ...s,
                  otpStatus: 'Confirmed',
                  status: 'Completed',
                  confirmationDate: now,
                  cogs,
                }
              : s
          )
        );

        // Update Vendor stats
        setVendors((prev) =>
          prev.map((v) =>
            v.vendorId === sale.vendorId
              ? {
                  ...v,
                  totalPurchases: (v.totalPurchases || 0) + 1,
                  totalPurchaseValue: (v.totalPurchaseValue || 0) + Number(sale.totalAmount),
                  outstandingReceivables: (v.outstandingReceivables || 0) + Number(sale.totalAmount),
                }
              : v
          )
        );

        // Add Ledger entry (Receivable from Vendor)
        const newLedger = {
          ledgerId: generateId('LED'),
          date: sale.salesDate || now.slice(0, 10),
          transactionId: sale.saleId,
          description: `Sale of ${sale.quantity} ${sale.unit || 'Qtl'} ${sale.cropName} to ${sale.businessName}`,
          partyId: sale.vendorId,
          partyName: sale.businessName,
          partyCategory: 'Vendor',
          debit: Number(sale.totalAmount),
          credit: 0,
          runningBalance: 0,
          expectedPaymentDate: sale.expectedPaymentDate,
          status: 'Pending',
          settledAmount: 0,
          outstandingAmount: Number(sale.totalAmount),
        };
        setLedger((prev) => [newLedger, ...prev]);

        addNotification({
          title: 'Vendor Sale Confirmed',
          description: `${sale.quantity} ${sale.unit || 'Qtl'} ${sale.cropName} confirmed by ${sale.businessName}. Stock updated.`,
          category: 'Transaction Completed',
          relatedId: sale.saleId,
          partyName: sale.businessName,
          actionUrl: '/middleman/sales-history',
        });
      }
    }

    // 4. Handle Customer Sale Confirmation -> Deducts stock & records in Ledger
    if (confItem.transactionType === 'Customer Sale') {
      const sale = customerSales.find((s) => s.saleId === confItem.transactionId);
      if (sale) {
        const cropBatches = inventory.filter((b) => b.cropName === sale.cropName);
        const { allocatedBatches, cogs } = allocateInventoryFIFO(cropBatches, sale.quantity);

        setInventory((prev) =>
          prev.map((batch) => {
            const allocation = allocatedBatches.find((a) => a.stockId === batch.stockId);
            if (allocation) {
              const newSold = (batch.soldQuantity || 0) + allocation.allocatedQuantity;
              const newAvail = Math.max(0, (batch.purchasedQuantity || 0) - newSold);
              return {
                ...batch,
                soldQuantity: newSold,
                availableQuantity: newAvail,
                status: newAvail <= 0 ? 'Exhausted' : newAvail <= 30 ? 'Low Stock' : 'In Stock',
              };
            }
            return batch;
          })
        );

        setCustomerSales((prev) =>
          prev.map((s) =>
            s.saleId === sale.saleId
              ? {
                  ...s,
                  otpStatus: 'Confirmed',
                  status: 'Completed',
                  confirmationDate: now,
                  cogs,
                }
              : s
          )
        );

        setCustomers((prev) =>
          prev.map((c) =>
            c.customerId === sale.customerId
              ? {
                  ...c,
                  totalPurchases: (c.totalPurchases || 0) + 1,
                  totalPurchaseValue: (c.totalPurchaseValue || 0) + Number(sale.finalAmount),
                  outstandingReceivables: (c.outstandingReceivables || 0) + Number(sale.finalAmount),
                }
              : c
          )
        );

        const newLedger = {
          ledgerId: generateId('LED'),
          date: sale.salesDate || now.slice(0, 10),
          transactionId: sale.saleId,
          description: `Sale of ${sale.quantity} ${sale.unit || 'Qtl'} ${sale.cropName} to ${sale.customerName}`,
          partyId: sale.customerId,
          partyName: sale.customerName,
          partyCategory: 'Customer',
          debit: Number(sale.finalAmount),
          credit: 0,
          runningBalance: 0,
          expectedPaymentDate: sale.expectedPaymentDate,
          status: 'Pending',
          settledAmount: 0,
          outstandingAmount: Number(sale.finalAmount),
        };
        setLedger((prev) => [newLedger, ...prev]);

        addNotification({
          title: 'Customer Sale Confirmed',
          description: `${sale.quantity} ${sale.unit || 'Qtl'} ${sale.cropName} delivery confirmed by ${sale.customerName}.`,
          category: 'Customer Purchase Confirmation',
          relatedId: sale.saleId,
          partyName: sale.customerName,
          actionUrl: '/middleman/sales-history',
        });
      }
    }
  }, [confirmations, purchases, vendorSales, customerSales, inventory, addNotification]);

  // Reject Transaction Action
  const rejectTransaction = useCallback((confirmationId, reason = 'Verification rejected by party.') => {
    const confItem = confirmations.find((c) => c.confirmationId === confirmationId);
    if (!confItem) return;

    setConfirmations((prev) =>
      prev.map((c) =>
        c.confirmationId === confirmationId
          ? { ...c, otpStatus: 'Rejected', notes: `${c.notes} [Rejected: ${reason}]` }
          : c
      )
    );

    if (confItem.transactionType === 'Farmer Purchase') {
      setPurchases((prev) =>
        prev.map((p) =>
          p.purchaseId === confItem.transactionId
            ? { ...p, otpStatus: 'Rejected', status: 'Cancelled' }
            : p
        )
      );
    } else if (confItem.transactionType === 'Vendor Sale') {
      setVendorSales((prev) =>
        prev.map((s) =>
          s.saleId === confItem.transactionId
            ? { ...s, otpStatus: 'Rejected', status: 'Cancelled' }
            : s
        )
      );
    } else if (confItem.transactionType === 'Customer Sale') {
      setCustomerSales((prev) =>
        prev.map((s) =>
          s.saleId === confItem.transactionId
            ? { ...s, otpStatus: 'Rejected', status: 'Cancelled' }
            : s
        )
      );
    }

    addNotification({
      title: 'Transaction Verification Rejected',
      description: `${confItem.transactionType} ${confItem.transactionId} rejected: ${reason}`,
      category: 'Transaction Completed',
      relatedId: confItem.transactionId,
      partyName: confItem.partyName,
      priority: 'high',
      actionUrl: '/middleman/confirmations',
    });
  }, [confirmations, addNotification]);

  // Settle Ledger Entry
  const settleLedgerEntry = useCallback((ledgerId, settledAmount) => {
    setLedger((prev) =>
      prev.map((item) => {
        if (item.ledgerId === ledgerId) {
          const total = item.debit > 0 ? item.debit : item.credit;
          const newSettled = (item.settledAmount || 0) + Number(settledAmount);
          const newOutstanding = Math.max(0, total - newSettled);
          const newStatus = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';
          return {
            ...item,
            settledAmount: newSettled,
            outstandingAmount: newOutstanding,
            status: newStatus,
          };
        }
        return item;
      })
    );
  }, []);

  // Compute Live Dashboard Metrics
  const dashboardMetrics = useMemo(() => {
    const totalFarmers = farmers.length;
    const totalVendors = vendors.length;
    const totalCustomers = customers.length;

    const confirmedPurchases = purchases.filter((p) => p.otpStatus === 'Confirmed');
    const totalPurchasesCount = confirmedPurchases.length;
    const totalPurchaseValue = confirmedPurchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);

    const confirmedVendorSales = vendorSales.filter((s) => s.otpStatus === 'Confirmed');
    const confirmedCustomerSales = customerSales.filter((s) => s.otpStatus === 'Confirmed');
    const totalSalesCount = confirmedVendorSales.length + confirmedCustomerSales.length;

    const vendorSalesVal = confirmedVendorSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const customerSalesVal = confirmedCustomerSales.reduce((acc, s) => acc + (Number(s.finalAmount) || 0), 0);
    const totalSalesValue = vendorSalesVal + customerSalesVal;

    const availableInventory = inventory.reduce((acc, b) => acc + (Number(b.availableQuantity) || 0), 0);

    // Receivables & Payables
    const totalReceivables = ledger
      .filter((l) => (l.partyCategory === 'Vendor' || l.partyCategory === 'Customer') && l.status !== 'Paid')
      .reduce((acc, l) => acc + (Number(l.outstandingAmount) || 0), 0);

    const totalPayables = ledger
      .filter((l) => l.partyCategory === 'Farmer' && l.status !== 'Paid')
      .reduce((acc, l) => acc + (Number(l.outstandingAmount) || 0), 0);

    const amountReceived = ledger
      .filter((l) => l.partyCategory === 'Vendor' || l.partyCategory === 'Customer')
      .reduce((acc, l) => acc + (Number(l.settledAmount) || 0), 0);

    // Cost of Goods Sold from confirmed sales
    const totalCogs =
      confirmedVendorSales.reduce((acc, s) => acc + (Number(s.cogs) || 0), 0) +
      confirmedCustomerSales.reduce((acc, s) => acc + (Number(s.cogs) || 0), 0);

    const otherExpenses = 35000; // standard operating demo expenses (godown rent, handling)
    const { grossProfit, marginPercentage } = calculateGrossProfit(totalSalesValue, totalCogs, otherExpenses);
    const { netOutstanding } = calculateOutstandingPosition(totalReceivables, totalPayables);

    return {
      totalFarmers,
      totalVendors,
      totalCustomers,
      totalPurchasesCount,
      totalSalesCount,
      availableInventory,
      totalPurchaseValue,
      totalSalesValue,
      expectedReceivables: totalReceivables,
      expectedPayables: totalPayables,
      amountReceived,
      grossProfit,
      marginPercentage,
      netOutstanding,
      totalCogs,
    };
  }, [farmers, vendors, customers, purchases, vendorSales, customerSales, inventory, ledger]);

  // Reset to initial demo dataset
  const resetToDemoData = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY}_profile`);
    localStorage.removeItem(`${STORAGE_KEY}_farmers`);
    localStorage.removeItem(`${STORAGE_KEY}_vendors`);
    localStorage.removeItem(`${STORAGE_KEY}_customers`);
    localStorage.removeItem(`${STORAGE_KEY}_purchases`);
    localStorage.removeItem(`${STORAGE_KEY}_inventory`);
    localStorage.removeItem(`${STORAGE_KEY}_vendor_sales`);
    localStorage.removeItem(`${STORAGE_KEY}_customer_sales`);
    localStorage.removeItem(`${STORAGE_KEY}_confirmations`);
    localStorage.removeItem(`${STORAGE_KEY}_ledger`);
    localStorage.removeItem(`${STORAGE_KEY}_notifications`);

    setProfile(INITIAL_PROFILE);
    setFarmers(INITIAL_FARMERS);
    setVendors(INITIAL_VENDORS);
    setCustomers(INITIAL_CUSTOMERS);
    setPurchases(INITIAL_PURCHASES);
    setInventory(INITIAL_INVENTORY_BATCHES);
    setVendorSales(INITIAL_VENDOR_SALES);
    setCustomerSales(INITIAL_CUSTOMER_SALES);
    setConfirmations(INITIAL_CONFIRMATIONS);
    setLedger(INITIAL_LEDGER_ENTRIES);
    setNotifications(INITIAL_NOTIFICATIONS);
  }, []);

  const value = {
    profile,
    updateProfile,
    farmers,
    addFarmer,
    updateFarmer,
    vendors,
    addVendor,
    updateVendor,
    customers,
    addCustomer,
    updateCustomer,
    purchases,
    createPurchase,
    vendorSales,
    createVendorSale,
    customerSales,
    createCustomerSale,
    inventory,
    confirmations,
    confirmTransaction,
    rejectTransaction,
    ledger,
    settleLedgerEntry,
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dashboardMetrics,
    resetToDemoData,
  };

  return <MiddlemanContext.Provider value={value}>{children}</MiddlemanContext.Provider>;
};

export default MiddlemanProvider;
