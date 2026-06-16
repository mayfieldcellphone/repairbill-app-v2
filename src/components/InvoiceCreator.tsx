import React, { useState, useEffect } from 'react';
import { BRANDS } from '../lib/brandData';
import { REPAIR_SERVICES as STATIC_SERVICES, getSavedServices } from '../lib/serviceData';
import { Brand, ProductSeries, ProductModel, RepairService, InvoiceItem, InvoiceSettings, Invoice, Customer } from '../lib/types';
import { getBrandCatalog, saveCustomModel, saveCustomBrand } from '../lib/deviceStore';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronRight, 
  Smartphone, 
  Settings, 
  CheckCircle2, 
  X, 
  Plus, 
  ShoppingCart, 
  Trash2,
  ChevronLeft,
  Activity,
  AlertTriangle,
  Receipt,
  FileCheck,
  Undo2,
  Redo2,
  Printer,
  Download,
  Share2,
  User,
  Mail,
  Phone,
  Building2,
  Search,
  Calendar,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { InvoiceTemplate } from './InvoiceTemplate';
import { generatePDF, printInvoice, shareInvoice } from '../lib/invoiceUtils';

export function InvoiceCreator({ settings, onInvoiceCreated, invoiceToEdit, onClose, nextInvoiceNumber, initialType = 'invoice', brands: initialBrands, onCatalogUpdate, services: initialServices, onServicesUpdate, initialBrandName, initialServiceName, initialServiceIds }: { 
  settings: InvoiceSettings,
  onInvoiceCreated: (invoice: Invoice) => void,
  invoiceToEdit?: Invoice | null,
  onClose?: () => void,
  nextInvoiceNumber?: number,
  initialType?: 'invoice' | 'estimate',
  brands?: Brand[],
  onCatalogUpdate?: (data: { brandName: string, modelName?: string, action: 'add_brand' | 'add_model' | 'remove_brand' | 'remove_model' }) => void,
  services?: RepairService[],
  onServicesUpdate?: (services: RepairService[], deletedId?: string) => void,
  initialBrandName?: string,
  initialServiceName?: string,
  initialServiceIds?: string[]
}) {
  const theme = settings.appTheme;
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState<'invoice' | 'estimate'>(initialType);
  const [brandsLocal, setBrandsLocal] = useState<Brand[]>(() => getBrandCatalog());
  const brands = initialBrands || brandsLocal;
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(() => {
    if (initialBrandName) {
      return (initialBrands || brandsLocal).find(b => b.name.toLowerCase() === initialBrandName.toLowerCase()) || null;
    }
    return null;
  });
  const [selectedSeries, setSelectedSeries] = useState<ProductSeries | null>(() => {
    if (initialBrandName) {
      const brand = (initialBrands || brandsLocal).find(b => b.name.toLowerCase() === initialBrandName.toLowerCase());
      if (brand && brand.series && brand.series.length > 0) {
        return brand.series[0];
      }
    }
    return null;
  });
  const [selectedModel, setSelectedModel] = useState<ProductModel | null>(() => {
    if (initialBrandName) {
      const brand = (initialBrands || brandsLocal).find(b => b.name.toLowerCase() === initialBrandName.toLowerCase());
      if (brand && brand.series && brand.series.length > 0 && brand.series[0].models && brand.series[0].models.length > 0) {
        return brand.series[0].models[0];
      }
    }
    return null;
  });
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  });
  
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'hardware' | 'software' | 'accessory' | 'other'>('all');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [history, setHistory] = useState<InvoiceItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (invoiceToEdit) {
      setDocType(invoiceToEdit.type || 'invoice');
      setInvoiceItems(invoiceToEdit.items);
      setHistory([[...invoiceToEdit.items]]);
      setHistoryIndex(0);
      setCustomerName(invoiceToEdit.customerName);
      setCustomerEmail(invoiceToEdit.customerEmail === 'N/A' ? '' : invoiceToEdit.customerEmail);
      setCustomerPhone(invoiceToEdit.customerPhone);
      setCustomerCompany(invoiceToEdit.customerCompany || '');
      setCustomerNotes(invoiceToEdit.customerNotes || '');
      setPaymentMethod(invoiceToEdit.paymentMethod || 'Card');
      setInvoiceDate(invoiceToEdit.date);
      
      // Restore brand and model selection from the first item to allow adding more items
      if (invoiceToEdit.items.length > 0) {
        const firstItem = invoiceToEdit.items[0];
        const currentBrands = getBrandCatalog();
        const brand = currentBrands.find(b => b.name === firstItem.brandName);
        if (brand) {
          setSelectedBrand(brand);
          for (const s of brand.series) {
            const model = s.models.find(m => m.name === firstItem.modelName);
            if (model) {
              setSelectedModel(model);
              setSelectedSeries(s);
              break;
            }
          }
        }
      }
      
      setStep(2); // Start at step 2 when editing
    }
  }, [invoiceToEdit]);

  const [servicesLocal, setServicesLocal] = useState<RepairService[]>(() => {
    return getSavedServices();
  });
  const services = initialServices || servicesLocal;

  // Advance to step 2 if a brand is preset
  useEffect(() => {
    if (initialBrandName && selectedBrand && selectedModel && !invoiceToEdit) {
      setStep(2);
    }
  }, [initialBrandName, selectedBrand, selectedModel, invoiceToEdit]);

  // Auto-add preset service if provided
  useEffect(() => {
    if (initialServiceName && selectedBrand && selectedModel && invoiceItems.length === 0 && !invoiceToEdit) {
      const srv = services.find(s => s.name.toLowerCase() === initialServiceName.toLowerCase());
      if (srv) {
        const savedPricesRaw = localStorage.getItem('honeybill_service_prices');
        const sPrices = savedPricesRaw ? JSON.parse(savedPricesRaw) : {};
        const initialPrice = sPrices[srv.id] || srv.basePrice || 0;
        const newItem: InvoiceItem = {
          id: Math.random().toString(36).substr(2, 9),
          serviceId: srv.id,
          brandName: selectedBrand.name,
          modelName: selectedModel.name,
          serviceName: srv.name,
          price: initialPrice,
          quantity: 1,
        };
        setInvoiceItems([newItem]);
        setHistory([[newItem]]);
        setHistoryIndex(0);
        setStep(2);
      }
    }
  }, [initialServiceName, selectedBrand, selectedModel, services, invoiceToEdit]);

  // Auto-add multiple preset services if provided
  useEffect(() => {
    if (initialServiceIds && initialServiceIds.length > 0 && selectedBrand && selectedModel && invoiceItems.length === 0 && !invoiceToEdit) {
      const savedPricesRaw = localStorage.getItem('honeybill_service_prices');
      const sPrices = savedPricesRaw ? JSON.parse(savedPricesRaw) : {};
      
      const newItems: InvoiceItem[] = [];
      initialServiceIds.forEach(id => {
        const srv = services.find(s => s.id === id);
        if (srv) {
          const initialPrice = sPrices[srv.id] || srv.basePrice || 0;
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            serviceId: srv.id,
            brandName: selectedBrand.name,
            modelName: selectedModel.name,
            serviceName: srv.name,
            price: initialPrice,
            quantity: 1,
          });
        }
      });
      
      if (newItems.length > 0) {
        setInvoiceItems(newItems);
        setHistory([newItems]);
        setHistoryIndex(0);
        setStep(2);
      }
    }
  }, [initialServiceIds, selectedBrand, selectedModel, services, invoiceToEdit]);

  const handleUpdateServices = (updated: RepairService[], deletedId?: string) => {
    if (onServicesUpdate) {
      onServicesUpdate(updated, deletedId);
    } else {
      setServicesLocal(updated);
      localStorage.setItem('honeybill_custom_services', JSON.stringify(updated));
    }
  };

  const [serviceMode, setServiceMode] = useState<'repair' | 'sale'>('repair');
  const [showAllServices, setShowAllServices] = useState(false);

  const COMMON_REPAIR_SERVICE_NAMES = [
    "Screen Replacement (OEM)",
    "Screen Replacement (Aftermarket)",
    "Battery Replacement",
    "Charging Port Replacement",
    "Back Glass Replacement",
    "Camera Replacement"
  ];

  const [invoiceMultiSelectedServices, setInvoiceMultiSelectedServices] = useState<RepairService[]>([]);

  const handleToggleInvoiceMultiSelect = (e: React.MouseEvent, service: RepairService) => {
    e.stopPropagation();
    setInvoiceMultiSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      if (isSelected) return prev.filter(s => s.id !== service.id);
      return [...prev, service];
    });
  };

  const handleAddMultipleServices = () => {
    if (invoiceMultiSelectedServices.length === 0) return;
    
    // Add all of them with default or saved prices
    let currentItems = [...invoiceItems];
    const newPrices = { ...savedPrices };
    
    invoiceMultiSelectedServices.forEach(srv => {
      const initialPrice = savedPrices[srv.id] || srv.basePrice || 0;
      const newItem: InvoiceItem = {
        id: Math.random().toString(36).substr(2, 9),
        serviceId: srv.id,
        brandName: selectedBrand?.name || 'Unknown',
        modelName: selectedModel?.name || 'Unknown',
        serviceName: srv.name,
        price: initialPrice,
        quantity: 1,
      };
      currentItems.push(newItem);
      newPrices[srv.id] = initialPrice;
    });
    
    pushToHistory(currentItems);
    setSavedPrices(newPrices);
    localStorage.setItem('honeybill_service_prices', JSON.stringify(newPrices));
    setInvoiceMultiSelectedServices([]);
  };

  const toggleVisibilityDashboard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = services.map(s => 
      s.id === id ? { ...s, hidden: !s.hidden } : s
    );
    handleUpdateServices(updated);
  };

  const getFilteredServicesList = () => {
    return services.filter(s => {
      // 1. Matches Category
      if (activeCategory !== 'all' && s.category !== activeCategory) {
        return false;
      }
      
      // 2. Matches Search Query
      if (serviceSearchQuery) {
        return s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase());
      }
      
      // 3. Matches Service Mode (Sale vs Repair)
      if (serviceMode === 'sale') {
        if (!["Used iPhone", "Used Samsung", "Used Android", "Used iPad", "Used Laptop"].includes(s.name)) return false;
      } else {
        if (["Used iPhone", "Used Samsung", "Used Android", "Used iPad", "Used Laptop"].includes(s.name)) return false;
      }

      // If they don't want to show ALL services, hide the non-common ones and the hidden ones
      if (!showAllServices) {
        if (s.hidden) return false;
        // Optionally filter dynamically by COMMON if desired, but user just wants visibility toggles.
        // If we strictly filter by common, custom ones disappear unless they click show all.
      } else {
        // If showAllServices is true, we show even hidden ones so they can be toggled!
      }

      return true;
    });
  };

  const getSuggestedSaleService = () => {
    if (!selectedBrand && !selectedModel) return null;
    const bName = (selectedBrand?.name || '').toLowerCase();
    const mName = (selectedModel?.name || '').toLowerCase();
    
    if (bName.includes('apple') || mName.includes('iphone') || mName.includes('ipad') || mName.includes('macbook')) {
      if (mName.includes('ipad')) return "Used iPad";
      if (mName.includes('macbook') || mName.includes('laptop')) return "Used Laptop";
      return "Used iPhone";
    }
    if (bName.includes('samsung')) return "Used Samsung";
    if (mName.includes('laptop') || bName.includes('dell') || bName.includes('hp') || bName.includes('lenovo') || bName.includes('asus') || bName.includes('acer')) {
      return "Used Laptop";
    }
    if (bName.includes('ipad') || mName.includes('tablet')) return "Used iPad";
    
    return "Used Android";
  };

  const suggestedSaleServiceName = getSuggestedSaleService();
  const suggestedService = suggestedSaleServiceName ? services.find(s => s.name === suggestedSaleServiceName) : null;

  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<RepairService['category']>('hardware');

  const handleDeleteService = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    const updatedServices = services.filter(s => s.id !== serviceId);
    handleUpdateServices(updatedServices, serviceId);
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;

    const newService: RepairService = {
      id: `custom-${Math.random().toString(36).substr(2, 9)}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      basePrice: 0
    };

    const updatedServices = [...services, newService];
    handleUpdateServices(updatedServices);
    
    setNewServiceName('');
    setShowAddService(false);
    
    // Select the newly created service immediately
    handleSelectItem(newService);
  };

  const handleAddCustomBrand = () => {
    if (!newBrandName.trim()) return;
    if (onCatalogUpdate) {
      onCatalogUpdate({ brandName: newBrandName.trim(), action: 'add_brand' });
      // Optimistically select it
      setSelectedBrand({ id: newBrandName.toLowerCase().replace(/[^a-z0-9]/g, '-'), name: newBrandName.trim(), series: [{ id: 'general', name: 'General', models: [] }] });
    } else {
      const brand = saveCustomBrand(newBrandName);
      if (brand) {
        setBrandsLocal(getBrandCatalog());
        setSelectedBrand(brand);
      }
    }
    setNewBrandName('');
    setShowAddBrand(false);
  };

  const handleAddCustomModel = () => {
    if (!selectedBrand || !newModelName.trim()) return;
    
    // Default to 'general' series if none selected, or the selected one
    const seriesId = selectedSeries?.id || 'general';
    
    // helper to prepare service price if there's a pending service
    const triggerPriceModal = () => {
      if (pendingService) {
        setServiceToPrice(pendingService);
        const initialPrice = savedPrices[pendingService.id] || pendingService.basePrice || 0;
        setPriceInput(initialPrice > 0 ? initialPrice.toString() : '');
      }
    };

    if (onCatalogUpdate) {
      onCatalogUpdate({ brandName: selectedBrand.name, modelName: newModelName.trim(), action: 'add_model' });
      const newModelId = newModelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newModel = { id: newModelId, name: newModelName.trim() };
      setSelectedModel(newModel);
      setSelectedSeries(selectedSeries || { id: 'general', name: 'General', models: [newModel] });
      setStep(2);
      triggerPriceModal();
    } else {
      saveCustomModel(selectedBrand.id, seriesId, newModelName);
      
      // Refresh catalog
      const updatedBrands = getBrandCatalog();
      setBrandsLocal(updatedBrands);
      
      // Find the new model to select it
      const updatedBrand = updatedBrands.find(b => b.id === selectedBrand.id);
      if (updatedBrand) {
        setSelectedBrand(updatedBrand);
        const updatedSeries = updatedBrand.series.find(s => s.id === seriesId);
        if (updatedSeries) {
          const newModelId = newModelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const newModel = updatedSeries.models.find(m => m.id === newModelId);
          if (newModel) {
            setSelectedModel(newModel);
            setSelectedSeries(updatedSeries);
            setStep(2);
            triggerPriceModal();
          }
        }
      }
    }
    
    setNewModelName('');
    setShowAddModel(false);
  };

  const pushToHistory = (newItems: InvoiceItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newItems]);
    // Limit history to 50 items to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setInvoiceItems(newItems);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setInvoiceItems(history[prevIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setInvoiceItems(history[nextIndex]);
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Other'>('Card');
  
  // Customer Data State
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [allCustomers, setAllCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('honeybill_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse honeybill_customers', e);
      }
    }
    return [];
  });
  
  // Editing state
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [editQuantityInput, setEditQuantityInput] = useState<string>('');

  // Price persistence and entry state
  const [serviceToPrice, setServiceToPrice] = useState<RepairService | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [savedPrices, setSavedPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('honeybill_service_prices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse honeybill_service_prices', e);
      }
    }
    return {};
  });
  const [pendingService, setPendingService] = useState<RepairService | null>(null);

  const handleSelectItem = (service: RepairService) => {
    if (selectedModel) {
      setServiceToPrice(service);
      const initialPrice = savedPrices[service.id] || service.basePrice || 0;
      setPriceInput(initialPrice > 0 ? initialPrice.toString() : '');
      setQuantityInput('1');
      return;
    }
    
    if (settings.creationFlowOrder === 'service-first') {
      setPendingService(service);
      if (step === 1) setStep(2);
    } else {
      setServiceToPrice(service);
      const initialPrice = savedPrices[service.id] || service.basePrice || 0;
      setPriceInput(initialPrice > 0 ? initialPrice.toString() : '');
      setQuantityInput('1');
    }
  };

  const handleStartEdit = (item: InvoiceItem) => {
    setEditingItem(item);
    setEditPriceInput(item.price.toString());
    setEditQuantityInput(item.quantity.toString());
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    
    const price = parseFloat(editPriceInput) || 0;
    const roundedPrice = Math.round(price);
    const quantity = parseInt(editQuantityInput) || 1;
    
    const updatedItems = invoiceItems.map(item => 
      item.id === editingItem.id 
        ? { ...item, price: roundedPrice, quantity } 
        : item
    );
    
    pushToHistory(updatedItems);

    // Save custom price for future use
    const newSavedPrices = { ...savedPrices, [editingItem.serviceId]: roundedPrice };
    setSavedPrices(newSavedPrices);
    localStorage.setItem('honeybill_service_prices', JSON.stringify(newSavedPrices));

    setEditingItem(null);
  };

  const handleAddItem = () => {
    if (!selectedBrand || !selectedModel || !serviceToPrice) return;
    
    const price = parseFloat(priceInput) || 0;
    const roundedPrice = Math.round(price);
    const quantity = parseInt(quantityInput) || 1;

    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId: serviceToPrice.id,
      brandName: selectedBrand.name,
      modelName: selectedModel.name,
      serviceName: serviceToPrice.name,
      price: roundedPrice,
      quantity: quantity,
    };
    
    pushToHistory([...invoiceItems, newItem]);

    const newSavedPrices = { ...savedPrices, [serviceToPrice.id]: roundedPrice };
    setSavedPrices(newSavedPrices);
    localStorage.setItem('honeybill_service_prices', JSON.stringify(newSavedPrices));

    setServiceToPrice(null);
    setPriceInput('');
    setQuantityInput('1');
  };

  const removeItem = (id: string) => {
    pushToHistory(invoiceItems.filter(i => i.id !== id));
  };

  const handleFinalize = (isEstimate: boolean = false) => {
    const finalType = isEstimate ? 'estimate' : 'invoice';
    const finalStatus = isEstimate ? 'estimate' : (invoiceToEdit ? invoiceToEdit.status : 'paid');
    const prefix = isEstimate ? settings.estimatePrefix : settings.invoicePrefix;

    const newInvoice: Invoice = {
      id: invoiceToEdit ? invoiceToEdit.id : Math.random().toString(36).substr(2, 9),
      invoiceNumber: invoiceToEdit ? invoiceToEdit.invoiceNumber : `${prefix}${(nextInvoiceNumber || 1).toString().padStart(3, '0')}`,
      customerName: customerName,
      customerEmail: customerEmail || 'N/A',
      customerPhone: customerPhone,
      customerCompany: customerCompany,
      customerNotes: customerNotes,
      date: invoiceDate,
      dueDate: invoiceToEdit && invoiceToEdit.date === invoiceDate ? invoiceToEdit.dueDate : new Date(new Date(invoiceDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: invoiceItems,
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total,
      status: finalStatus as any,
      type: finalType,
      paymentMethod: paymentMethod,
    };

    // Save Customer if new
    if (customerName !== 'Walk-in Customer' && isNewCustomer) {
      const newCustomer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        company: customerCompany,
        notes: customerNotes,
        createdAt: new Date().toISOString()
      };
      const updatedCustomers = [...allCustomers, newCustomer];
      setAllCustomers(updatedCustomers);
      localStorage.setItem('honeybill_customers', JSON.stringify(updatedCustomers));
    }

    setLastCreatedInvoice(newInvoice);
    setIsFinalized(true);
    onInvoiceCreated(newInvoice);
  };

  const handleReset = () => {
    setShowConfirm(false);
    setInvoiceItems([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setStep(1);
    setSelectedBrand(null);
    setSelectedModel(null);
    const today = new Date();
    setInvoiceDate(today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'));
    setIsFinalized(false);
    setLastCreatedInvoice(null);
    setCustomerName('Walk-in Customer');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerCompany('');
    setCustomerNotes('');
    setIsNewCustomer(true);
  };

  const baseTotal = invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let subtotal = 0;
  let taxAmount = 0;
  let total = 0;

  if (settings.taxInclusive) {
    total = Math.round(baseTotal);
    subtotal = Math.round(total / (1 + settings.taxRate / 100));
    taxAmount = total - subtotal;
  } else {
    subtotal = Math.round(baseTotal);
    taxAmount = Math.round(subtotal * (settings.taxRate / 100));
    total = subtotal + taxAmount;
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: settings.currency || 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  };

  return (
    <div className={cn(
      "max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500",
      theme === 'minimalist' && "font-serif"
    )}>
      {/* Modals Layer */}
      <AnimatePresence mode="wait">
        {showAddBrand && (
          <div key="add-brand" className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border"
            >
              <div className="p-6 bg-muted border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Add New Brand</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Expand your catalog</p>
                </div>
                <button onClick={() => setShowAddBrand(false)} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Brand Name</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="e.g. Nothing, Infinix..."
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-muted border border-transparent focus:border-primary focus:bg-card text-sm font-bold text-foreground transition-all outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddBrand(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-all text-sm">Cancel</button>
                  <button onClick={handleAddCustomBrand} className="flex-[2] px-6 py-3 rounded-xl font-bold text-primary-foreground shadow-lg text-sm bg-primary hover:brightness-110 transition-all">Create Brand</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showAddModel && (
          <div key="add-model" className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border"
            >
              <div className="p-6 bg-muted border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Add New Model</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">For {selectedBrand?.name}</p>
                </div>
                <button onClick={() => setShowAddModel(false)} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Model Name</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="e.g. iPhone SE 4, Galaxy S26..."
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-muted border border-transparent focus:border-primary focus:bg-card text-sm font-bold text-foreground transition-all outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddModel(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-all text-sm">Cancel</button>
                  <button onClick={handleAddCustomModel} className="flex-[2] px-6 py-3 rounded-xl font-bold text-primary-foreground shadow-lg text-sm bg-primary hover:brightness-110 transition-all">Save to Catalog</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-md">
              {docType === 'estimate' ? 'Quoting Engine' : 'Invoice Generator'}
            </span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tighter">
            {invoiceToEdit ? 'Adjusting Order' : 'Capture New Work'}
          </h2>
          <p className="text-muted-foreground text-xs font-semibold">
            {docType === 'estimate' 
              ? 'Drafting a professional quotation for approval' 
              : 'Creating a tax-compliant receipt for services'}
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          <button 
            onClick={() => setDocType('invoice')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              docType === 'invoice' 
                ? "bg-card text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Invoice
          </button>
          <button 
            onClick={() => setDocType('estimate')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              docType === 'estimate' 
                ? "bg-card text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Quote
          </button>
        </div>
      </div>

      <div className="space-y-6 relative">
        {/* Step Progress & Quick Stats Footer */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between p-6 bg-card rounded-[2rem] border border-border shadow-xl shadow-primary/5">
          <div className="flex items-center gap-4 flex-1">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl font-black transition-all shadow-sm",
              step === 1 ? "bg-primary text-primary-foreground shadow-primary/20 scale-110" : "bg-muted text-muted-foreground"
            )}>1</div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                {settings.creationFlowOrder === 'service-first' ? 'Selection A' : 'Hardware'}
              </p>
              <p className="text-sm font-bold text-foreground truncate">
                {settings.creationFlowOrder === 'service-first' 
                  ? (pendingService ? pendingService.name : 'Choose Job')
                  : (selectedModel ? `${selectedBrand?.name} ${selectedModel.name}` : 'Select Device')
                }
              </p>
            </div>
            <ChevronRight className="text-muted-foreground/30 shrink-0" size={16} />
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl font-black transition-all shadow-sm",
              step === 2 ? "bg-primary text-primary-foreground shadow-primary/20 scale-110" : "bg-muted text-muted-foreground"
            )}>2</div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                {settings.creationFlowOrder === 'service-first' ? 'Selection B' : 'Repair'}
              </p>
              <p className="text-sm font-bold text-foreground truncate">
                {settings.creationFlowOrder === 'service-first'
                  ? (selectedModel ? `${selectedBrand?.name} ${selectedModel.name}` : 'Target Device')
                  : 'Add Services'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 pl-6 border-l border-border/50">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">Est. Revenue</p>
              <p className="text-2xl font-black text-primary tracking-tighter">{formatPrice(total)}</p>
            </div>
            <button 
              disabled={invoiceItems.length === 0}
              onClick={() => setShowConfirm(true)}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-3 group"
            >
              {invoiceToEdit ? 'Save Changes' : docType === 'estimate' ? 'Post Quote' : 'Post Invoice'}
              <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {showAddService && (
          <div key="add-service-modal" className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border"
            >
              <div className="p-6 bg-muted border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">New Service</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Create custom catalog item</p>
                </div>
                <button 
                  onClick={() => setShowAddService(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Service Name</label>
                    <input 
                      autoFocus
                      type="text"
                      placeholder="e.g. True Tone Restoration"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl bg-muted border border-transparent focus:border-primary focus:bg-card text-sm font-bold text-foreground transition-all outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['hardware', 'software', 'accessory', 'other'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setNewServiceCategory(cat as any)}
                          className={cn(
                            "py-2 rounded-xl text-[10px] font-bold border transition-all",
                            newServiceCategory === cat 
                              ? "bg-foreground text-background border-foreground" 
                              : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30"
                          )}
                        >
                          {cat.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowAddService(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddService}
                    className="flex-[2] px-6 py-3 rounded-xl font-bold text-primary-foreground shadow-lg bg-primary hover:brightness-110 transition-all text-sm"
                  >
                    Create Service
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingItem && (
          <div key="edit-item-modal" className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border"
            >
              <div className="p-6 bg-primary/10 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Edit Invoice Item</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{editingItem.serviceName}</p>
                </div>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-card transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                      <input 
                        autoFocus
                        type="number"
                        value={editPriceInput}
                        onChange={(e) => setEditPriceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="w-full pl-10 pr-4 py-6 rounded-2xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card text-2xl font-black text-foreground transition-all outline-none"
                      />
                      <label className="absolute -top-2 left-4 px-1 bg-card text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price</label>
                    </div>
                    <div className="relative">
                      <input 
                        type="number"
                        min="1"
                        value={editQuantityInput}
                        onChange={(e) => setEditQuantityInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="w-full px-4 py-6 rounded-2xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card text-2xl font-black text-foreground transition-all outline-none"
                      />
                      <label className="absolute -top-2 left-4 px-1 bg-card text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Qty</label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setEditingItem(null)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="flex-[2] px-6 py-3 rounded-xl font-bold text-primary-foreground bg-primary shadow-lg text-sm"
                  >
                    Update Item
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {serviceToPrice && (
          <div key="price-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border"
            >
              <div className="p-6 bg-muted border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Set Repair Price</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{serviceToPrice.name}</p>
                </div>
                <button 
                  onClick={() => setServiceToPrice(null)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                      <input 
                        autoFocus
                        type="number"
                        placeholder="0.00"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="w-full pl-10 pr-4 py-6 rounded-2xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card text-2xl font-black text-foreground transition-all outline-none"
                      />
                      <label className="absolute -top-2 left-4 px-1 bg-card text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price</label>
                    </div>
                    <div className="relative">
                      <input 
                        type="number"
                        min="1"
                        placeholder="1"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="w-full px-4 py-6 rounded-2xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card text-2xl font-black text-foreground transition-all outline-none"
                      />
                      <label className="absolute -top-2 left-4 px-1 bg-card text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Qty</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 50, 100].map(val => (
                      <button 
                        key={val}
                        onClick={() => setPriceInput(val.toString())}
                        className="py-2 rounded-xl bg-muted text-[10px] font-bold text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-all"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 p-1 bg-muted rounded-xl">
                    <button 
                      onClick={() => setPriceInput(Math.round(parseFloat(priceInput || '0')).toString())}
                      className="flex-1 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground"
                    >
                      Round
                    </button>
                    <button 
                      onClick={() => setPriceInput(Math.ceil((parseFloat(priceInput || '0')) / 5) * 5 + '')}
                      className="flex-1 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground"
                    >
                      Nearest 5
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setServiceToPrice(null)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddItem}
                    className="flex-[2] px-6 py-3 rounded-xl font-bold text-primary-foreground bg-primary shadow-lg transition-all text-sm"
                  >
                    Save & Add Item
                  </button>
                </div>
                
                <p className="text-[9px] text-center text-muted-foreground italic">
                  This price will be saved for next time.
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirm && (
          <div key="confirm-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-border"
            >
              {!isFinalized ? (
                <>
                  <div className="p-8 bg-muted border-b border-border flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground bg-primary shadow-lg">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Final Step</h3>
                      <p className="text-sm text-muted-foreground font-medium">Customer & Review</p>
                    </div>
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="ml-auto p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-foreground">
                    {/* Customer Details Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Customer Details</h4>
                        <div className="flex bg-muted p-1 rounded-lg">
                          <button 
                            onClick={() => {
                              setCustomerName('Walk-in Customer');
                              setCustomerEmail('');
                              setCustomerPhone('');
                              setCustomerCompany('');
                              setIsNewCustomer(true);
                            }}
                            className={cn(
                              "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                              customerName === 'Walk-in Customer' ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
                            )}
                          >
                            Walk-in
                          </button>
                          <button 
                            onClick={() => {
                                if (customerName === 'Walk-in Customer') setCustomerName('');
                            }}
                            className={cn(
                              "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                              customerName !== 'Walk-in Customer' ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
                            )}
                          >
                            Details
                          </button>
                        </div>
                      </div>

                      {customerName !== 'Walk-in Customer' ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                           <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                              type="text" 
                              placeholder="Customer Name"
                              value={customerName}
                              onChange={(e) => {
                                setCustomerName(e.target.value);
                                setIsNewCustomer(true);
                              }}
                              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground/50"
                            />
                            {customerName.length > 1 && isNewCustomer && allCustomers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-2xl mt-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                     {allCustomers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).map(c => (
                                         <button 
                                            key={c.id}
                                            onClick={() => {
                                                setCustomerName(c.name);
                                                setCustomerEmail(c.email);
                                                setCustomerPhone(c.phone);
                                                setCustomerCompany(c.company || '');
                                                setCustomerNotes(c.notes || '');
                                                setIsNewCustomer(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-muted text-sm border-b border-border last:border-0 flex justify-between items-center group"
                                         >
                                             <div>
                                               <p className="font-bold text-foreground">{c.name}</p>
                                               <p className="text-[10px] text-muted-foreground">{c.phone} • {c.email}</p>
                                               {c.notes && <p className="text-[9px] text-primary font-medium truncate max-w-[150px]">Note: {c.notes}</p>}
                                             </div>
                                             <div className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 uppercase tracking-widest">Select</div>
                                         </button>
                                     ))}
                                </div>
                            )}
                          </div>
                            <div className="grid grid-cols-2 gap-3 relative">
                              <div className="relative">
                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                  type="tel" 
                                  placeholder="Phone No."
                                  value={customerPhone}
                                  onChange={(e) => {
                                    setCustomerPhone(e.target.value);
                                    setIsNewCustomer(true);
                                  }}
                                  className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground/50"
                                />
                                {customerPhone.length > 3 && isNewCustomer && allCustomers.filter(c => c.phone.includes(customerPhone)).length > 0 && (
                                  <div className="absolute top-full left-0 z-50 w-[250px] bg-card border border-border rounded-xl shadow-2xl mt-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                      {allCustomers.filter(c => c.phone.includes(customerPhone)).map(c => (
                                          <button 
                                              key={c.id}
                                              onClick={() => {
                                                  setCustomerName(c.name);
                                                  setCustomerEmail(c.email);
                                                  setCustomerPhone(c.phone);
                                                  setCustomerCompany(c.company || '');
                                                  setCustomerNotes(c.notes || '');
                                                  setIsNewCustomer(false);
                                              }}
                                              className="w-full text-left px-4 py-3 hover:bg-muted text-sm border-b border-border last:border-0 flex justify-between items-center group"
                                          >
                                              <div>
                                                <p className="font-bold text-foreground">{c.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                                              </div>
                                          </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                              <div className="relative">
                              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <input 
                                type="email" 
                                placeholder="Email"
                                value={customerEmail}
                                onChange={(e) => {
                                  setCustomerEmail(e.target.value);
                                  setIsNewCustomer(true);
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground/50"
                              />
                              {customerEmail.length > 3 && isNewCustomer && allCustomers.filter(c => c.email.toLowerCase().includes(customerEmail.toLowerCase())).length > 0 && (
                                  <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-2xl mt-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                      {allCustomers.filter(c => c.email.toLowerCase().includes(customerEmail.toLowerCase())).map(c => (
                                          <button 
                                              key={c.id}
                                              onClick={() => {
                                                  setCustomerName(c.name);
                                                  setCustomerEmail(c.email);
                                                  setCustomerPhone(c.phone);
                                                  setCustomerCompany(c.company || '');
                                                  setCustomerNotes(c.notes || '');
                                                  setIsNewCustomer(false);
                                              }}
                                              className="w-full text-left px-4 py-3 hover:bg-muted text-sm border-b border-border last:border-0 flex justify-between items-center group"
                                          >
                                              <div>
                                                <p className="font-bold text-foreground">{c.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{c.email}</p>
                                              </div>
                                          </button>
                                      ))}
                                  </div>
                              )}
                            </div>
                          </div>
                          <div className="relative">
                            <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                              type="text" 
                              placeholder="Company (Optional)"
                              value={customerCompany}
                              onChange={(e) => setCustomerCompany(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground/50"
                            />
                          </div>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                              type="date" 
                              value={invoiceDate}
                              onChange={(e) => setInvoiceDate(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                            />
                            <p className="text-[10px] font-bold text-muted-foreground mt-1 px-1 uppercase tracking-widest flex items-center gap-1">
                               <Sparkles size={10} className="text-primary" /> Back-date this {docType}
                            </p>
                          </div>
                          <div className="relative">
                            <textarea 
                              placeholder="Customer Notes (Internal - e.g. Preferences, repair history tips...)"
                              value={customerNotes}
                              onChange={(e) => setCustomerNotes(e.target.value)}
                              className="w-full p-4 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all min-h-[80px] text-foreground placeholder:text-muted-foreground/50"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted rounded-xl border border-border flex items-center gap-3">
                          <CheckCircle2 className="text-success" size={18} />
                          <span className="text-sm font-bold text-muted-foreground italic">Walk-in Customer (Standard)</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="flex justify-between items-end border-b-2 border-border pb-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Summary of Services</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Tax: {settings.taxRate}%</p>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {invoiceItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border">
                                {item.quantity}x
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{item.serviceName}</p>
                                <p className="text-[10px] text-muted-foreground">{item.brandName} {item.modelName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                              {item.quantity > 1 && (
                                <p className="text-[9px] text-muted-foreground">{formatPrice(item.price)} each</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Payment Method</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Cash', 'Card', 'Bank Transfer', 'Other'] as const).map(m => (
                          <button
                            key={m}
                            onClick={() => setPaymentMethod(m)}
                            className={cn(
                              "py-2 rounded-xl text-[10px] font-bold border transition-all",
                              paymentMethod === m 
                                ? "bg-foreground text-background border-foreground" 
                                : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30"
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Document Date</p>
                      </div>
                      <input 
                         type="date" 
                         value={invoiceDate}
                         onChange={(e) => setInvoiceDate(e.target.value)}
                         className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                      />
                    </div>

                    <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2">
                      {!settings.taxInclusive && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Subtotal (Excl.)</span>
                            <span className="font-bold text-foreground">{formatPrice(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">GST ({settings.taxRate}%)</span>
                            <span className="font-bold text-foreground">{formatPrice(taxAmount)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <span className="text-sm font-bold text-foreground uppercase tracking-tighter">Total {settings.taxInclusive ? '(Inc. GST)' : ''}</span>
                        <span className="text-xl font-black text-primary">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button 
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 px-6 py-4 rounded-2xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-all text-sm"
                      >
                        Cancel
                      </button>
                      
                      {docType === 'invoice' && !invoiceToEdit && (
                        <button 
                          onClick={() => handleFinalize(true)}
                          className="flex-1 px-6 py-4 rounded-2xl font-bold text-muted-foreground bg-muted border border-border hover:bg-muted/80 transition-all text-sm"
                        >
                          Save as Quote
                        </button>
                      )}

                      <button 
                        onClick={() => handleFinalize(docType === 'estimate')}
                        className="flex-[2] px-6 py-4 rounded-2xl font-bold text-primary-foreground bg-primary shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        {invoiceToEdit ? 'Save Changes' : docType === 'estimate' ? 'Confirm Quote' : 'Confirm & Finalize'}
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center space-y-8">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto shadow-sm"
                  >
                    <CheckCircle2 size={40} />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                      {invoiceToEdit ? (docType === 'estimate' ? 'Quote Updated' : 'Invoice Updated') : 
                       (lastCreatedInvoice?.type === 'estimate' ? 'Quote Finalized' : 'Invoice Finalized')}
                    </h3>
                    <p className="text-muted-foreground font-medium mt-2">
                       {lastCreatedInvoice?.type === 'estimate' ? 'Quote' : 'Invoice'} #{lastCreatedInvoice?.invoiceNumber} for {lastCreatedInvoice?.customerName}.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button 
                      onClick={() => lastCreatedInvoice && generatePDF(`printable-invoice-${lastCreatedInvoice.id}`, `Invoice_${lastCreatedInvoice.invoiceNumber}`)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:text-primary transition-all font-bold group"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Download size={20} />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary">Download</span>
                    </button>
                    <button 
                      onClick={() => lastCreatedInvoice && printInvoice(`printable-invoice-${lastCreatedInvoice.id}`)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-success/40 hover:text-success transition-all font-bold group"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-success/10 flex items-center justify-center transition-colors">
                        <Printer size={20} />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-success">Print</span>
                    </button>
                    <button 
                      onClick={() => lastCreatedInvoice && shareInvoice(lastCreatedInvoice, settings)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:text-primary transition-all font-bold group"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Share2 size={20} />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary">Share</span>
                    </button>
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <button 
                      onClick={handleReset}
                      className="w-full px-6 py-4 rounded-2xl font-bold bg-primary text-primary-foreground shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> Create Another Invoice
                    </button>
                    {onClose && (
                      <button 
                        onClick={onClose}
                        className="w-full px-6 py-4 rounded-2xl font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-all text-sm"
                      >
                        Back to Invoice List
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {settings.creationFlowOrder === 'service-first' ? (
              // REVERSED WORKFLOW (Service -> Device)
              <>
                {step === 1 && (
                  <motion.div key="rev-step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    {/* Service Mode Selector */}
                    <div className="flex bg-muted p-1 rounded-2xl max-w-sm">
                      <button 
                        type="button"
                        onClick={() => { setServiceMode('repair'); setActiveCategory('all'); }} 
                        className={cn("flex-1 py-1 px-3 rounded-xl text-xs font-bold transition-all", serviceMode === 'repair' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                      >
                        Repairs & Services
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setServiceMode('sale'); setActiveCategory('other'); }} 
                        className={cn("flex-1 py-1 px-3 rounded-xl text-xs font-bold transition-all", serviceMode === 'sale' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                      >
                        Used Phone/Device Sale
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {serviceMode === 'repair' ? (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                          {(['all', 'hardware', 'software', 'accessory', 'other'] as const).map(cat => (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => setActiveCategory(cat)}
                              className={cn(
                                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                activeCategory === cat 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Select Sold Product Type
                        </div>
                      )}
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          type="text"
                          placeholder={serviceMode === 'repair' ? "Search repairs..." : "Search sales..."}
                          value={serviceSearchQuery}
                          onChange={(e) => setServiceSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>

                    {serviceMode === 'repair' && !serviceSearchQuery && (
                      <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-muted/30 border border-border/40 rounded-2xl">
                        <span className="text-xs text-muted-foreground font-semibold">
                          {showAllServices 
                            ? "Showing all available repair services" 
                            : "Showing most common repairs only"
                          }
                        </span>
                        <button 
                          type="button"
                          onClick={() => setShowAllServices(!showAllServices)}
                          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                        >
                          {showAllServices ? "Show Common Only" : "Show All Services"}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getFilteredServicesList().length === 0 && (
                        <div className="col-span-full py-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl p-6">
                          <p className="text-xs text-muted-foreground font-semibold">
                            No common services visible in this category.
                          </p>
                          <button 
                            type="button" 
                            onClick={() => setShowAllServices(true)}
                            className="mt-2 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                          >
                            Show All & Hidden Services
                          </button>
                        </div>
                      )}
                      {getFilteredServicesList().map(service => {
                        const isMultiSelected = invoiceMultiSelectedServices.some(s => s.id === service.id);
                        return (
                          <div
                            key={service.id}
                            className={cn(
                              "group p-5 border rounded-2xl transition-all text-left flex justify-between items-center relative",
                              isMultiSelected 
                                ? "bg-primary/5 border-primary/40" 
                                : "bg-card border-border hover:border-primary/40 hover:bg-primary/5",
                              service.hidden && "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
                            )}
                          >
                            <button
                              type="button"
                              className="absolute inset-0 w-full h-full text-left"
                              onClick={() => {
                                if (invoiceMultiSelectedServices.length > 0) {
                                  // toggle this instead of adding immediately if in multi mode
                                  setInvoiceMultiSelectedServices(prev => {
                                    const exists = prev.find(s => s.id === service.id);
                                    if (exists) return prev.filter(s => s.id !== service.id);
                                    return [...prev, service];
                                  });
                                } else {
                                  handleSelectItem(service);
                                }
                              }}
                            />
                            
                            <div className="relative z-10 flex items-center gap-3 pointer-events-none">
                              <input 
                                type="checkbox"
                                checked={isMultiSelected}
                                onChange={() => {}} // handled by div click
                                className="pointer-events-auto rounded border-slate-300 text-primary focus:ring-primary h-5 w-5"
                                onClick={(e) => handleToggleInvoiceMultiSelect(e, service)}
                              />
                              <div>
                                <h4 className={cn("font-bold transition-colors", isMultiSelected ? "text-primary" : "text-foreground group-hover:text-primary")}>
                                  {service.name}
                                </h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                                  {service.category} {service.hidden && "(Hidden)"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="relative z-10 flex items-center gap-2">
                              {showAllServices && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleVisibilityDashboard(e, service.id)}
                                  className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    service.hidden ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100" : "text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                  )}
                                  title={service.hidden ? "Hidden from Creator. Click to show." : "Visible in Creator. Click to hide."}
                                >
                                  {service.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectItem(service);
                                }}
                                className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {serviceMode === 'repair' && (
                        <button 
                          type="button"
                          onClick={() => setShowAddService(true)}
                          className="group p-5 bg-muted/50 border border-dashed border-border hover:border-primary/40 rounded-2xl transition-all text-left flex justify-between items-center"
                        >
                          <div>
                            <h4 className="font-bold text-muted-foreground group-hover:text-primary transition-colors">Missing a service?</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Create Custom</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-card group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                            <Plus size={18} />
                          </div>
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {invoiceMultiSelectedServices.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mt-6 flex justify-end"
                        >
                          <button
                            type="button"
                            onClick={handleAddMultipleServices}
                            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                          >
                            <Plus size={18} />
                            Add Selected Services ({invoiceMultiSelectedServices.length})
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="rev-step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    {pendingService && (
                      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 text-primary rounded-xl"><Settings size={16} /></div>
                          <p className="text-sm font-bold text-primary">Repairing for: <span className="underline">{pendingService.name}</span></p>
                        </div>
                        <button onClick={() => { setPendingService(null); setStep(1); }} className="text-[10px] font-black uppercase text-primary/60 hover:text-primary">Change Service</button>
                      </div>
                    )}
                    
                    {!selectedBrand ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {brands.filter(b => b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())).map(brand => (
                          <button key={brand.id} onClick={() => setSelectedBrand(brand)} className="bg-card p-6 rounded-2xl border border-border hover:border-primary/40 text-center transition-all group">
                            <div className="w-16 h-16 bg-muted mx-auto mb-4 rounded-xl flex items-center justify-center text-2xl font-black text-muted-foreground/20 group-hover:bg-primary/10 group-hover:text-primary transition-colors">{brand.name[0]}</div>
                            <span className="font-bold text-foreground">{brand.name}</span>
                          </button>
                        ))}
                        <button onClick={() => setShowAddBrand(true)} className="bg-muted p-6 rounded-2xl border border-dashed border-border hover:border-primary/40 text-center transition-all group flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-card mx-auto mb-4 rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors hover:scale-110">
                            <Plus size={24} />
                          </div>
                          <span className="font-bold text-muted-foreground group-hover:text-primary">Add Brand</span>
                        </button>
                      </div>
                    ) : !selectedModel ? (
                      <div className="space-y-4">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                           <button onClick={() => setSelectedBrand(null)} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline mt-1"><ChevronLeft size={14} /> Back to Brands</button>
                           <div className="flex items-center gap-2 w-full sm:w-auto">
                             <div className="relative w-full sm:w-64 shrink-0">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                               <input
                                 type="text"
                                 placeholder="Search models..."
                                 value={modelSearchQuery}
                                 onChange={(e) => setModelSearchQuery(e.target.value)}
                                 className="w-full pl-9 pr-10 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/50"
                               />
                             </div>
                             <button 
                               onClick={() => setShowAddModel(true)}
                               className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold flex flex-1 sm:flex-none items-center justify-center gap-2 whitespace-nowrap transition-colors shrink-0"
                             >
                               <Plus size={16} />
                               <span className="hidden sm:inline">New Model</span>
                             </button>
                           </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedBrand.series.map(series => {
                            const filtered = series.models.filter(m => m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()));
                            if (modelSearchQuery && filtered.length === 0) return null;
                            return (
                              <div key={series.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                                <div className="bg-muted p-4 border-b border-border flex items-center justify-between">
                                  <span className="font-bold text-foreground text-sm">{series.name}</span>
                                  <Smartphone size={16} className="text-muted-foreground" />
                                </div>
                                <div className="p-2 grid grid-cols-1 gap-1">
                                  {filtered.map(model => (
                                    <button 
                                      key={model.id} 
                                      onClick={() => {
                                        setSelectedModel(model);
                                        setSelectedSeries(series);
                                        if (pendingService) {
                                          setServiceToPrice(pendingService);
                                          const initialPrice = savedPrices[pendingService.id] || pendingService.basePrice || 0;
                                          setPriceInput(initialPrice > 0 ? initialPrice.toString() : '');
                                        }
                                      }}
                                      className="w-full text-left px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary font-medium transition-colors"
                                    >
                                      {model.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                         <div className="bg-success/5 p-8 rounded-[32px] border border-success/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-primary/10 flex items-center justify-center text-primary">
                                <Smartphone size={40} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Target Device Identified</p>
                                <h3 className="text-2xl font-black text-primary leading-none">{selectedBrand.name} {selectedModel.name}</h3>
                              </div>
                            </div>
                            <button onClick={() => setSelectedModel(null)} className="px-6 py-3 rounded-2xl bg-white border border-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all shadow-sm">Change Device</button>
                         </div>
                         <div className="pt-6 border-t border-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Add More Services to this device</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).slice(0, 4).map(service => (
                                <button 
                                  key={service.id}
                                  onClick={() => handleSelectItem(service)}
                                  className="p-4 bg-card hover:bg-primary/5 border border-border rounded-xl transition-all text-left flex justify-between items-center group"
                                >
                                  <span className="font-bold text-foreground group-hover:text-primary text-sm">{service.name}</span>
                                  <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all"><Plus size={16} /></div>
                                </button>
                              ))}
                            </div>
                         </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            ) : (
              // STANDARD WORKFLOW (Step 1 Device -> Step 2 Service)
              <>
                {step === 1 ? (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    {!selectedBrand ? (
                      <div className="space-y-4">
                        <div className="relative w-full sm:w-64 shrink-0 mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search brands..."
                            value={brandSearchQuery}
                            onChange={(e) => setBrandSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-10 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/50"
                          />
                        </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {brands.filter(b => b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())).map(brand => (
                          <button
                            key={brand.id}
                            onClick={() => setSelectedBrand(brand)}
                            className="bg-card p-6 rounded-2xl border border-border hover:border-primary/40 hover:shadow-md transition-all group flex flex-col items-center gap-4 text-center"
                          >
                            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-2xl text-2xl font-bold text-muted-foreground/30 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                              {brand.name[0]}
                            </div>
                            <span className="font-bold text-foreground">{brand.name}</span>
                          </button>
                        ))}
                        <button onClick={() => setShowAddBrand(true)} className="bg-muted p-6 rounded-2xl border border-dashed border-border hover:border-primary/40 text-center transition-all group flex flex-col items-center justify-center gap-4">
                          <div className="w-16 h-16 bg-card mx-auto rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors hover:scale-110">
                            <Plus size={24} />
                          </div>
                          <span className="font-bold text-muted-foreground group-hover:text-primary">Add Brand</span>
                        </button>
                      </div>
                      </div>
                    ) : !selectedModel ? (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                          <button 
                            onClick={() => setSelectedBrand(null)}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline mt-1"
                          >
                            <ChevronLeft size={14} /> Back to Brands
                          </button>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64 shrink-0">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                              <input
                                type="text"
                                placeholder="Search models..."
                                value={modelSearchQuery}
                                onChange={(e) => setModelSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-10 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/50"
                              />
                            </div>
                            <button 
                              onClick={() => setShowAddModel(true)}
                              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold flex flex-1 sm:flex-none items-center justify-center gap-2 whitespace-nowrap transition-colors shrink-0"
                            >
                              <Plus size={16} />
                              <span className="hidden sm:inline">New Model</span>
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedBrand.series.map(series => {
                            const filteredModels = series.models.filter(model => 
                              model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
                            );
                            if (modelSearchQuery && filteredModels.length === 0) return null;
                            return (
                              <div key={series.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                                <div className="bg-muted p-4 border-b border-border flex items-center justify-between">
                                  <span className="font-bold text-foreground text-sm">{series.name}</span>
                                  <Smartphone size={16} className="text-muted-foreground" />
                                </div>
                                <div className="p-2 grid grid-cols-1 gap-1">
                                  {filteredModels.map(model => (
                                    <button
                                      key={model.id}
                                      onClick={() => {
                                        setSelectedModel(model);
                                        setSelectedSeries(series);
                                        setStep(2);
                                      }}
                                      className="w-full text-left px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary font-medium transition-colors"
                                    >
                                      {model.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                ) : step === 2 ? (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                     <div className="bg-primary/5 p-8 rounded-[32px] border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-primary/10 flex items-center justify-center text-primary">
                            <Smartphone size={40} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Target Device</p>
                            <h3 className="text-2xl font-black text-primary leading-none">{selectedBrand?.name} {selectedModel?.name}</h3>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedModel(null); setStep(1); }} className="px-6 py-3 rounded-2xl bg-white border border-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all shadow-sm">Change Device</button>
                     </div>

                     {/* Service Mode Selector */}
                     <div className="flex bg-muted p-1 rounded-2xl max-w-sm">
                       <button 
                         type="button"
                         onClick={() => { setServiceMode('repair'); setActiveCategory('all'); }} 
                         className={cn("flex-1 py-1 px-3 rounded-xl text-xs font-bold transition-all", serviceMode === 'repair' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                       >
                         Repairs & Services
                       </button>
                       <button 
                         type="button"
                         onClick={() => { setServiceMode('sale'); setActiveCategory('other'); }} 
                         className={cn("flex-1 py-1 px-3 rounded-xl text-xs font-bold transition-all", serviceMode === 'sale' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                       >
                         Used Phone/Device Sale
                       </button>
                     </div>

                     {/* Suggested device-matched service for Selling */}
                     {serviceMode === 'sale' && suggestedService && (
                       <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-primary/10 text-primary rounded-xl">
                             <Sparkles size={16} className="animate-pulse" />
                           </div>
                           <div>
                             <p className="text-xs font-bold text-primary">Device Type Match:</p>
                             <p className="text-sm font-black text-primary">{suggestedService.name}</p>
                           </div>
                         </div>
                         <button 
                           type="button"
                           onClick={() => handleSelectItem(suggestedService)}
                           className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/95 transition-all shadow-sm rounded-xl"
                         >
                           Select Recommended
                         </button>
                       </div>
                     )}

                     <div className="space-y-4">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         {serviceMode === 'repair' ? (
                           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                             {(['all', 'hardware', 'software', 'accessory', 'other'] as const).map(cat => (
                               <button
                                 type="button"
                                 key={cat}
                                 onClick={() => setActiveCategory(cat)}
                                 className={cn(
                                   "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                   activeCategory === cat 
                                     ? "bg-primary text-primary-foreground" 
                                     : "bg-muted text-muted-foreground hover:bg-muted/80"
                                 )}
                               >
                                 {cat}
                               </button>
                             ))}
                           </div>
                         ) : (
                           <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                             Select Sold Product Type
                           </div>
                         )}
                         <div className="relative w-full sm:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                           <input
                             type="text"
                             placeholder={serviceMode === 'repair' ? "Search services..." : "Search sales..."}
                             value={serviceSearchQuery}
                             onChange={(e) => setServiceSearchQuery(e.target.value)}
                             className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/50"
                           />
                         </div>
                       </div>

                       {serviceMode === 'repair' && !serviceSearchQuery && (
                         <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-muted/30 border border-border/40 rounded-2xl">
                           <span className="text-xs text-muted-foreground font-semibold">
                             {showAllServices 
                               ? "Showing all available repair services" 
                               : "Showing most common repairs only"
                           }
                           </span>
                           <button 
                             type="button"
                             onClick={() => setShowAllServices(!showAllServices)}
                             className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                           >
                             {showAllServices ? "Show Common Only" : "Show All Services"}
                           </button>
                         </div>
                       )}

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {getFilteredServicesList().length === 0 && (
                           <div className="col-span-full py-6 text-center bg-muted/20 border border-dashed border-border rounded-xl px-4">
                             <p className="text-xs text-muted-foreground font-bold">
                               No common services visible here.
                             </p>
                             <button 
                               type="button" 
                               onClick={() => setShowAllServices(true)}
                               className="mt-1 text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                             >
                               Show All Services
                             </button>
                           </div>
                         )}
                         {getFilteredServicesList().map(service => (
                           <button 
                             type="button"
                             key={service.id}
                             onClick={() => handleSelectItem(service)}
                             className="group p-4 bg-card hover:bg-primary/5 border border-border hover:border-primary/40 rounded-2xl transition-all text-left flex justify-between items-center"
                           >
                             <div>
                               <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{service.name}</h4>
                               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">{service.category}</p>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                               <Plus size={18} />
                             </div>
                           </button>
                         ))}
                         {serviceMode === 'repair' && (
                           <button 
                             type="button"
                             onClick={() => setShowAddService(true)}
                             className="group p-4 bg-muted/50 border border-dashed border-border hover:border-primary/40 rounded-2xl transition-all text-left flex justify-between items-center"
                           >
                             <div>
                               <h4 className="font-bold text-muted-foreground group-hover:text-primary transition-colors">Missing a service?</h4>
                               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Create Custom</p>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-card group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                               <Plus size={18} />
                             </div>
                           </button>
                         )}
                       </div>
                     </div>
                  </motion.div>
                ) : null}
              </>
            )}
          </AnimatePresence>
        </div>
       </div>

        {/* Sidebar Cart */}
        <div className="space-y-4">
          <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 bg-foreground text-background flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className="text-primary" />
                <h4 className="font-bold text-foreground-inverse uppercase tracking-widest text-[10px]">Invoice Items</h4>
              </div>
              <div className="flex items-center gap-2">
                {historyIndex > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); undo(); }}
                    className="p-1.5 hover:bg-background/10 rounded-lg transition-colors text-background/70 hover:text-background"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 size={16} />
                  </button>
                )}
                {historyIndex < history.length - 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); redo(); }}
                    className="p-1.5 hover:bg-background/10 rounded-lg transition-colors text-background/70 hover:text-background"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 size={16} />
                  </button>
                )}
                <span className="bg-background/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase ml-1 text-background/80">{invoiceItems.length} Items</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {invoiceItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30">
                  <Plus size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest italic opacity-50 text-center">Select a device and service<br/>to start your invoice</p>
                </div>
              ) : (
                invoiceItems.map(item => (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-muted/40 rounded-2xl border border-border flex justify-between items-center group shadow-sm hover:shadow-md hover:bg-muted/60 transition-all cursor-pointer"
                    onClick={() => handleStartEdit(item)}
                  >
                    <div className="flex gap-3 flex-1 min-w-0 pr-2">
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-card border border-border flex items-center justify-center font-black text-[10px] text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-all">
                        {item.quantity}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase truncate tracking-tighter">{item.brandName} {item.modelName}</p>
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-all leading-tight">{item.serviceName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <p className="text-xs font-black text-primary">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <span className="text-[9px] text-muted-foreground font-medium">({formatPrice(item.price)} ea)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-border bg-muted/30 space-y-4">
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-foreground font-bold text-sm uppercase tracking-tight">Total Due (Inc. GST)</span>
                <span className="text-xl font-black text-primary">{formatPrice(total)}</span>
              </div>
              {invoiceItems.length > 0 && (
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20 hover:brightness-110 flex items-center justify-center gap-2 transition-all text-sm group mt-2"
                >
                  Review & Finalize
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden Template for PDF/Print */}
      <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none z-[-1] bg-white">
        {lastCreatedInvoice && (
          <div id={`printable-invoice-${lastCreatedInvoice.id}`} className="bg-white p-8 w-[800px]">
            <InvoiceTemplate 
              invoice={lastCreatedInvoice} 
              settings={settings} 
            />
          </div>
        )}
      </div>
    </div>
  );
}


