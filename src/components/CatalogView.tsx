import React, { useState, useRef } from 'react';
import { REPAIR_SERVICES as STATIC_SERVICES, getSavedServices } from '../lib/serviceData';
import { saveCustomBrand, saveCustomModel, getBrandCatalog } from '../lib/deviceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Laptop, Smartphone, Watch, Tablet, Download, Upload, Trash2, CheckCircle2, X, Plus, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical, Pin, Receipt, Sparkles, Play, Layers } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Brand, RepairService, InvoiceSettings } from '../lib/types';
import { motion, AnimatePresence } from 'motion/react';

export function CatalogView({ 
  brands, 
  onCatalogUpdate,
  services: initialServices,
  onServicesUpdate,
  settings,
  onSettingsUpdate,
  onServicesSelectedForInvoice
}: { 
  brands: Brand[], 
  onCatalogUpdate?: (data: { 
    brandName: string, 
    modelName?: string, 
    action: 'add_brand' | 'add_model' | 'remove_brand' | 'remove_model' | 'update_brand',
    updatedBrand?: Brand
  }) => void,
  services?: RepairService[],
  onServicesUpdate?: (services: RepairService[], deletedId?: string) => void,
  settings?: InvoiceSettings,
  onSettingsUpdate?: (settings: InvoiceSettings) => void,
  onServicesSelectedForInvoice?: (serviceIds: string[]) => void
}) {
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || '');
  const selectedBrand = brands.find(b => b.id === (selectedBrandId || brands[0]?.id)) || brands[0];
  const [searchTerm, setSearchTerm] = useState('');
  const [newModelNames, setNewModelNames] = useState<Record<string, string>>({});
  const [view, setView] = useState<'devices' | 'services' | 'setups'>('devices');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showSaveSetupModal, setShowSaveSetupModal] = useState(false);
  const [newSetupName, setNewSetupName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSetup = () => {
    if (!newSetupName.trim() || selectedServices.length === 0 || !onSettingsUpdate || !settings) return;
    const trimmed = newSetupName.trim();
    const currentSetups = settings.dashboardSetups || [];
    const newSetup = {
      id: Math.random().toString(36).substring(2, 9),
      name: trimmed,
      serviceIds: [...selectedServices]
    };
    onSettingsUpdate({
      ...settings,
      dashboardSetups: [...currentSetups, newSetup]
    });
    setNewSetupName('');
    setSelectedServices([]);
    setShowSaveSetupModal(false);
    setView('setups');
  };

  const handleDeleteSetup = (setupId: string) => {
    if (!onSettingsUpdate || !settings) return;
    const currentSetups = settings.dashboardSetups || [];
    onSettingsUpdate({
      ...settings,
      dashboardSetups: currentSetups.filter(s => s.id !== setupId)
    });
  };

  const handleToggleBrandPin = (brandId: string) => {
    if (!onSettingsUpdate || !settings) return;
    const currentList = settings.dashboardBrandIds || [];
    const isActive = currentList.includes(brandId);
    let newList;
    if (isActive) {
      newList = currentList.filter(id => id !== brandId);
    } else {
      newList = [...currentList, brandId];
    }
    onSettingsUpdate({ ...settings, dashboardBrandIds: newList });
  };

  const handleToggleServicePin = (serviceId: string) => {
    if (!onSettingsUpdate || !settings) return;
    const currentList = settings.dashboardServiceIds || [];
    const isActive = currentList.includes(serviceId);
    let newList;
    if (isActive) {
      newList = currentList.filter(id => id !== serviceId);
    } else {
      newList = [...currentList, serviceId];
    }
    onSettingsUpdate({ ...settings, dashboardServiceIds: newList });
  };
  
  const [servicesLocal, setServicesLocal] = useState<RepairService[]>(() => {
    return getSavedServices();
  });
  const services = initialServices || servicesLocal;

  const updateServicesList = (updated: RepairService[], deletedId?: string) => {
    if (onServicesUpdate) {
      onServicesUpdate(updated, deletedId);
    } else {
      setServicesLocal(updated);
      localStorage.setItem('honeybill_custom_services', JSON.stringify(updated));
    }
  };

  const [newBrandName, setNewBrandName] = useState('');

  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    const trimmed = newBrandName.trim();
    const newBrand = saveCustomBrand(trimmed);
    if (newBrand && onCatalogUpdate) {
      onCatalogUpdate({
        brandName: trimmed,
        action: 'add_brand'
      });
    }
    setNewBrandName('');
    if (newBrand) {
      setSelectedBrandId(newBrand.id);
    }
  };

  const handleDeleteBrand = (id: string) => {
    const brandToDelete = brands.find(b => b.id === id);
    if (!brandToDelete) return;
    if (confirm(`Are you sure you want to delete ${brandToDelete.name} and all its models from the catalog?`)) {
      const updated = brands.filter(b => b.id !== id);
      localStorage.setItem('honeybill_custom_devices', JSON.stringify(updated));
      if (onCatalogUpdate) {
        onCatalogUpdate({
          brandName: brandToDelete.name,
          action: 'remove_brand'
        });
      }
      if (selectedBrandId === id) {
        setSelectedBrandId(updated[0]?.id || '');
      }
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<RepairService['category']>('hardware');
  const [newServicePrice, setNewServicePrice] = useState('0');

  const moveService = (id: string, direction: 'up' | 'down') => {
    const index = services.findIndex(s => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === services.length - 1) return;

    const newServices = [...services];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newServices[index], newServices[targetIndex]] = [newServices[targetIndex], newServices[index]];
    
    updateServicesList(newServices);
  };

  const toggleVisibility = (id: string) => {
    const updated = services.map(s => 
      s.id === id ? { ...s, hidden: !s.hidden } : s
    );
    updateServicesList(updated);
  };

  const deleteService = (id: string) => {
    if (confirm('Delete this service from catalog?')) {
      const updated = services.filter(s => s.id !== id);
      updateServicesList(updated, id);
      showNotification('Service removed from catalog', 'success');
    }
  };

  const addService = () => {
    if (!newServiceName.trim()) return;
    const newService: RepairService = {
      id: `custom-${Math.random().toString(36).substr(2, 9)}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      basePrice: parseFloat(newServicePrice) || 0
    };
    const updated = [...services, newService];
    updateServicesList(updated);
    setShowAddModal(false);
    setNewServiceName('');
    setNewServicePrice('0');
    showNotification('Service added to catalog', 'success');
  };

  const toggleSelectedVisibility = (hide: boolean) => {
    if (selectedServices.length === 0) return;
    const updated = services.map(s => 
      selectedServices.includes(s.id) ? { ...s, hidden: hide } : s
    );
    updateServicesList(updated);
    showNotification(`${selectedServices.length} services ${hide ? 'hidden' : 'made visible'}`, 'success');
  };

  const deleteSelectedServices = () => {
    if (selectedServices.length === 0) return;
    if (confirm(`Delete ${selectedServices.length} selected services?`)) {
      const updated = services.filter(s => !selectedServices.includes(s.id));
      // Write logic to delete each one
      selectedServices.forEach(srvId => {
        updateServicesList(updated, srvId);
      });
      setSelectedServices([]);
      showNotification(`${selectedServices.length} services removed`, 'success');
    }
  };

  const toggleSelectAll = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(s => s.id));
    }
  };

  const toggleSelectService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const onDragEndServices = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(services);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Explicitly update order properties
    items.forEach((item, index) => {
      item.order = index;
    });

    updateServicesList(items);
  };

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddModel = (seriesId: string) => {
    const modelName = newModelNames[seriesId];
    if (!modelName || !modelName.trim() || !selectedBrand) return;
    
    const trimName = modelName.trim();
    const modelId = trimName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check if duplicate
    const brandCopy = JSON.parse(JSON.stringify(selectedBrand)) as Brand;
    const series = brandCopy.series.find(s => s.id === seriesId);
    if (!series) return;
    
    if (series.models.find(m => m.id === modelId)) {
      showNotification('Model already exists', 'error');
      return;
    }
    
    // Set explicit order on all models of this series if not present
    series.models.forEach((m, idx) => {
      if (m.order === undefined) {
        m.order = idx;
      }
    });
    
    series.models.push({
      id: modelId,
      name: trimName,
      order: series.models.length
    });
    
    if (onCatalogUpdate) {
      onCatalogUpdate({
        brandName: brandCopy.name,
        action: 'update_brand',
        updatedBrand: brandCopy
      });
      showNotification(`Added ${trimName} to ${series.name}`, 'success');
      setNewModelNames(prev => ({ ...prev, [seriesId]: '' }));
    }
  };

  const handleMoveModel = (seriesId: string, modelId: string, direction: 'up' | 'down') => {
    if (!selectedBrand) return;
    
    const brandCopy = JSON.parse(JSON.stringify(selectedBrand)) as Brand;
    const series = brandCopy.series.find(s => s.id === seriesId);
    if (!series) return;
    
    // Assign order property to all models if missing or misaligned
    series.models.forEach((m, idx) => {
      if (m.order === undefined) m.order = idx;
    });
    
    // Find model index
    const idx = series.models.findIndex(m => m.id === modelId);
    if (idx === -1) return;
    
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === series.models.length - 1) return;
    
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    // Swap models in array
    const temp = series.models[idx];
    series.models[idx] = series.models[targetIdx];
    series.models[targetIdx] = temp;
    
    // Update order values explicitly
    series.models.forEach((m, i) => {
      m.order = i;
    });
    
    if (onCatalogUpdate) {
      onCatalogUpdate({
        brandName: brandCopy.name,
        action: 'update_brand',
        updatedBrand: brandCopy
      });
      showNotification('Model order updated', 'success');
    }
  };

  const handleRemoveModel = (seriesId: string, modelId: string) => {
    if (!selectedBrand) return;
    
    if (confirm('Are you sure you want to delete this model from the catalog?')) {
      const brandCopy = JSON.parse(JSON.stringify(selectedBrand)) as Brand;
      const series = brandCopy.series.find(s => s.id === seriesId);
      if (!series) return;
      
      const modelToRemove = series.models.find(m => m.id === modelId);
      series.models = series.models.filter(m => m.id !== modelId);
      
      // Re-assign order properties to clean gaps
      series.models.forEach((m, i) => {
        m.order = i;
      });
      
      if (onCatalogUpdate) {
        onCatalogUpdate({
          brandName: brandCopy.name,
          action: 'update_brand',
          updatedBrand: brandCopy
        });
        showNotification(`Removed ${modelToRemove?.name || 'model'}`, 'success');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['id', 'name', 'category', 'basePrice', 'hidden'];
    const csvRows = services.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.category,
      s.basePrice,
      s.hidden ? 'true' : 'false'
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'repair_services_catalog.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Catalog exported successfully', 'success');
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) throw new Error('Invalid CSV file');

        const headersInput = lines[0].toLowerCase().split(',');
        const headers = headersInput.map(h => h.trim().replace(/^"|"$/g, ''));
        const idIdx = headers.indexOf('id');
        const nameIdx = headers.indexOf('name');
        const categoryIdx = headers.indexOf('category');
        const priceIdx = headers.indexOf('baseprice');
        const hiddenIdx = headers.indexOf('hidden');

        if (nameIdx === -1 || categoryIdx === -1 || priceIdx === -1) {
          throw new Error('CSV must contain name, category, and basePrice columns');
        }

        const newServices: RepairService[] = lines.slice(1)
          .filter(line => line.trim() !== '')
          .map((line, idx) => {
            const parts: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              if (line[i] === '"') inQuotes = !inQuotes;
              else if (line[i] === ',' && !inQuotes) {
                parts.push(current);
                current = '';
              } else current += line[i];
            }
            parts.push(current);

            const name = parts[nameIdx]?.trim().replace(/^"|"$/g, '').replace(/""/g, '"') || 'Unnamed Service';
            const categoryInput = parts[categoryIdx]?.trim().toLowerCase() || 'other';
            const category = ['hardware', 'software', 'accessory', 'other'].includes(categoryInput) 
              ? categoryInput as any 
              : 'other';
            const basePrice = parseFloat(parts[priceIdx]) || 0;
            const hidden = hiddenIdx !== -1 ? parts[hiddenIdx]?.trim().toLowerCase() === 'true' : false;
            const id = idIdx !== -1 && parts[idIdx] 
              ? parts[idIdx].trim() 
              : name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + idx;

            return { id, name, category, basePrice, hidden };
          });

        updateServicesList(newServices);
        showNotification(`${newServices.length} services imported successfully`, 'success');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        showNotification('Failed to import CSV. Check format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = () => {
    if (confirm('Are you sure you want to reset the catalog to default services? This will overwrite your changes.')) {
      updateServicesList(STATIC_SERVICES);
      showNotification('Catalog reset to default', 'success');
    }
  };

  const getSeriesIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('iphone') || lower.includes('phone') || lower.includes('series') || lower.includes('reno')) return <Smartphone size={16} />;
    if (lower.includes('ipad') || lower.includes('tablet')) return <Tablet size={16} />;
    if (lower.includes('macbook') || lower.includes('laptop')) return <Laptop size={16} />;
    if (lower.includes('watch')) return <Watch size={16} />;
    return <Smartphone size={16} />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-20 right-8 z-50 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border",
              notification.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            <span className="text-sm font-bold tracking-tight">{notification.message}</span>
          </motion.div>
        )}
        
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Add New Service</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Name</label>
                  <Input 
                    placeholder="e.g. True Tone Restoration" 
                    value={newServiceName} 
                    onChange={e => setNewServiceName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Price</label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={newServicePrice} 
                    onChange={e => setNewServicePrice(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['hardware', 'software', 'accessory', 'other'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setNewServiceCategory(cat)}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-bold border transition-all",
                          newServiceCategory === cat ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
                        )}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={addService}
                  className="w-full py-4 mt-4 bg-blue-600 text-white rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-blue-100"
                >
                  Create Service
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSaveSetupModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSaveSetupModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl"
              >
                <X size={18} />
              </button>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                    <Pin size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Save Invoice Setup</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">Bundle {selectedServices.length} selected services together</p>
                  </div>
                </div>
                
                <div className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-2xl max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Included services:</p>
                  {selectedServices.map(sid => {
                    const srv = services.find(s => s.id === sid);
                    return srv ? (
                      <div key={sid} className="flex justify-between text-slate-700 font-semibold py-0.5 border-b border-secondary/10 last:border-0">
                        <span className="truncate max-w-[200px]">{srv.name}</span>
                        <span className="font-mono text-[10px]">${srv.basePrice.toFixed(2)}</span>
                      </div>
                    ) : null;
                  })}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setup Name</label>
                  <Input 
                    placeholder="e.g. Software Configuration Bundle, Full Diagnosis Pack" 
                    value={newSetupName} 
                    onChange={e => setNewSetupName(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSetupName.trim()) handleSaveSetup();
                    }}
                  />
                </div>

                <button 
                  onClick={handleSaveSetup}
                  disabled={!newSetupName.trim()}
                  className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Setup Bundle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {view === 'devices' ? 'Product Catalog' : view === 'services' ? 'Repair Services Catalog' : 'Invoice Setups & Launchpad'}
          </h2>
          <p className="text-sm text-slate-500">
            {view === 'devices' ? 'Global brand models and device specifications' : view === 'services' ? 'Manage your repair service price list' : 'Instant invoice shortcuts and custom multi-service setups'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setView('devices')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'devices' ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
            >
              Devices
            </button>
            <button 
              onClick={() => setView('services')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'services' ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
            >
              Services
            </button>
            <button 
              onClick={() => setView('setups')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'setups' ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
            >
              Launchpad & Setups
            </button>
          </div>

          {view !== 'setups' && (
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder={`Search ${view}...`} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl bg-card border-border"
              />
            </div>
          )}

          {view === 'services' && (
            <div className="flex gap-2">
              <AnimatePresence>
                {selectedServices.length > 0 && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex gap-2"
                  >
                    <button 
                      onClick={() => toggleSelectedVisibility(true)}
                      className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 px-4 shadow-sm border border-slate-200"
                      title="Hide Selected"
                    >
                      <EyeOff size={18} />
                    </button>
                    <button 
                      onClick={() => toggleSelectedVisibility(false)}
                      className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 px-4 shadow-sm border border-slate-200"
                      title="Show Selected"
                    >
                      <Eye size={18} />
                    </button>
                    {onServicesSelectedForInvoice && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onServicesSelectedForInvoice(selectedServices)}
                          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2 px-4 whitespace-nowrap border border-indigo-500"
                          title="Create Invoice with Selected Services"
                        >
                          <Receipt size={18} />
                          <span className="text-xs font-bold uppercase tracking-wider">Create Invoice ({selectedServices.length})</span>
                        </button>
                        <button 
                          onClick={() => {
                            setNewSetupName('');
                            setShowSaveSetupModal(true);
                          }}
                          className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg flex items-center gap-2 px-4 whitespace-nowrap border border-amber-400"
                          title="Save Selected Services as a Setup Bundle"
                        >
                          <Pin size={18} />
                          <span className="text-xs font-bold uppercase tracking-wider">Save Setup ({selectedServices.length})</span>
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={deleteSelectedServices}
                      className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center gap-2 px-4 whitespace-nowrap"
                    >
                      <Trash2 size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Delete ({selectedServices.length})</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button 
                onClick={() => setShowAddModal(true)}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 px-4 whitespace-nowrap"
              >
                <Plus size={18} />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Add Service</span>
              </button>
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={importFromCSV} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                title="Import CSV"
              >
                <Upload size={18} />
              </button>
              <button 
                onClick={exportToCSV}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                title="Export CSV"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={resetToDefault}
                className="p-2.5 bg-white border border-slate-200 text-red-500 rounded-xl hover:bg-red-50 transition-all shadow-sm"
                title="Reset to Default"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {view === 'devices' ? (
          <>
            <div className="space-y-4">
              {/* Brand Creation Box */}
              <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add New Brand</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Google, Nothing"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddBrand();
                    }}
                    className="h-9 text-xs rounded-lg border-slate-200"
                  />
                  <button 
                    onClick={handleAddBrand}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    title="Add Brand"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Brands Catalog List */}
              <div className="space-y-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 max-h-[500px] overflow-y-auto">
                {brands.map((brand) => (
                  <div key={brand.id} className="group relative">
                    <button
                      onClick={() => setSelectedBrandId(brand.id)}
                      className={cn(
                        "w-full flex items-center justify-between pl-4 pr-20 py-3 rounded-xl text-sm font-medium transition-all text-left",
                        selectedBrand.id === brand.id 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                          : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold",
                          selectedBrand.id === brand.id ? "bg-white/20" : "bg-slate-100 text-slate-400"
                        )}>
                          {brand.name[0]}
                        </div>
                        {brand.name}
                      </span>
                      <ChevronRight size={16} className={cn(
                        "transition-transform",
                        selectedBrand.id === brand.id ? "rotate-90" : "opacity-0"
                      )} />
                    </button>
                    {/* Pin Brand Button (Shortcut to Dashboard) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBrandPin(brand.id);
                      }}
                      className={cn(
                        "absolute right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all z-10",
                        (settings?.dashboardBrandIds || []).includes(brand.id)
                          ? "text-amber-500 bg-amber-500/10 opacity-100"
                          : "text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-amber-50 hover:text-amber-600"
                      )}
                      title={(settings?.dashboardBrandIds || []).includes(brand.id) ? "Featured on Dashboard. Click to remove." : "Feature on Dashboard. Click to add."}
                    >
                      <Pin size={13} className={cn((settings?.dashboardBrandIds || []).includes(brand.id) && "fill-amber-500 text-amber-500")} />
                    </button>
                    {/* Delete Brand Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBrand(brand.id);
                      }}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all z-10",
                        selectedBrand.id === brand.id ? "text-white/80 hover:text-white hover:bg-white/10" : "text-slate-400"
                      )}
                      title="Delete Brand"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedBrand.series.map((series) => {
                  const filteredModels = series.models.filter(m => 
                    m.name.toLowerCase().includes(searchTerm.toLowerCase())
                  );

                  if (searchTerm && filteredModels.length === 0) return null;

                  const onDragEndModels = (result: DropResult) => {
                    if (!result.destination) return;
                    const items = Array.from(series.models);
                    const [reorderedItem] = items.splice(result.source.index, 1);
                    items.splice(result.destination.index, 0, reorderedItem);
                    
                    // Assign order explicitly
                    items.forEach((m, idx) => m.order = idx);
                    
                    const brandCopy = JSON.parse(JSON.stringify(selectedBrand)) as Brand;
                    const s = brandCopy.series.find((x) => x.id === series.id);
                    if (s) s.models = items;
                    if (onCatalogUpdate) {
                      onCatalogUpdate({
                        brandName: brandCopy.name,
                        action: 'update_brand',
                        updatedBrand: brandCopy
                      });
                    }
                  };

                  return (
                    <Card key={series.id} className="rounded-xl border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-blue-600">
                              {getSeriesIcon(series.name)}
                            </div>
                            <CardTitle className="text-sm font-bold text-slate-800">{series.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <DragDropContext onDragEnd={onDragEndModels}>
                          <Droppable droppableId={`models-list-${series.id}`} isDropDisabled={!!searchTerm}>
                            {(provided) => (
                              <div 
                                className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto custom-scrollbar"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                              >
                                {filteredModels.map((model, index) => (
                                  <Draggable 
                                    key={model.id} 
                                    draggableId={model.id} 
                                    index={index}
                                    isDragDisabled={!!searchTerm}
                                  >
                                    {(provided, snapshot) => (
                                      <div 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{...provided.draggableProps.style}}
                                        className={cn(
                                          "px-6 py-2.5 flex justify-between items-center hover:bg-slate-50/80 transition-colors group",
                                          snapshot.isDragging && "bg-slate-50 shadow-md border-y border-blue-200 z-50"
                                        )}
                                      >
                                        <span className="text-xs font-bold text-slate-700">{model.name}</span>
                                        <div className="flex items-center gap-1.5">
                                          {model.releaseYear && (
                                            <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                              {model.releaseYear}
                                            </span>
                                          )}
                                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                                            {!searchTerm && (
                                              <div className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing">
                                                <GripVertical size={14} />
                                              </div>
                                            )}
                                            <button
                                              onClick={() => handleRemoveModel(series.id, model.id)}
                                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded ml-1"
                                              title="Delete Model"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                        {/* Inline Quick Add Model Form */}
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add model name..."
                            value={newModelNames[series.id] || ''}
                            onChange={(e) => setNewModelNames(prev => ({ ...prev, [series.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddModel(series.id);
                            }}
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400/60 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <button
                            onClick={() => handleAddModel(series.id)}
                            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md shadow-blue-100 shrink-0"
                            title="Add Model"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {searchTerm && selectedBrand.series.every(s => s.models.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0) && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                  <Smartphone size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 font-medium">No models matching "{searchTerm}" found for {selectedBrand.name}</p>
                </div>
              )}
            </div>
          </>
        ) : view === 'services' ? (
          <div className="lg:col-span-4">
            <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 w-10">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedServices.length === services.length && services.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Category</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Show?</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Dashboard</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Default Price</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <DragDropContext onDragEnd={onDragEndServices}>
                      <Droppable droppableId="services-list" isDropDisabled={!!searchTerm}>
                        {(provided) => (
                          <tbody 
                            className="divide-y divide-slate-50"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {services
                              .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.category.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map((service, idx) => (
                                <Draggable 
                                  key={service.id} 
                                  draggableId={service.id} 
                                  index={services.findIndex(s => s.id === service.id)}
                                  isDragDisabled={!!searchTerm}
                                >
                                  {(provided, snapshot) => (
                                    <tr 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{...provided.draggableProps.style}}
                                      className={cn(
                                        "hover:bg-slate-50 transition-colors group",
                                        selectedServices.includes(service.id) && "bg-blue-50/50",
                                        snapshot.isDragging && "bg-slate-50 shadow-lg border-y border-blue-200"
                                      )}
                                    >
                                      <td className="px-6 py-4 text-center">
                                        <input 
                                          type="checkbox" 
                                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                          checked={selectedServices.includes(service.id)}
                                          onChange={() => toggleSelectService(service.id)}
                                        />
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-800">{service.name}</span>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                          "text-[10px] font-black uppercase px-2 py-1 rounded",
                                          service.category === 'hardware' ? "bg-amber-50 text-amber-600" :
                                          service.category === 'software' ? "bg-blue-50 text-blue-600" :
                                          service.category === 'accessory' ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-600"
                                        )}>
                                          {service.category}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        <button
                                          onClick={() => toggleVisibility(service.id)}
                                          className={cn(
                                            "p-1.5 rounded-lg transition-all",
                                            service.hidden ? "text-slate-300 hover:text-slate-500" : "text-blue-500 hover:text-blue-700 bg-blue-50"
                                          )}
                                          title={service.hidden ? "Hidden from Creator" : "Visible in Creator"}
                                        >
                                          {service.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        <button
                                          onClick={() => handleToggleServicePin(service.id)}
                                          className={cn(
                                            "p-1.5 rounded-lg transition-all",
                                            (settings?.dashboardServiceIds || []).includes(service.id)
                                              ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                                              : "text-slate-300 hover:text-amber-500 hover:bg-slate-50"
                                          )}
                                          title={(settings?.dashboardServiceIds || []).includes(service.id) ? "Featured on Dashboard" : "Show on Dashboard Pin"}
                                        >
                                          <Pin size={16} className={cn((settings?.dashboardServiceIds || []).includes(service.id) && "fill-amber-500 text-amber-500")} />
                                        </button>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <span className="text-sm text-slate-400 font-bold">$</span>
                                          <input 
                                            type="number"
                                            value={service.basePrice === 0 ? '' : service.basePrice}
                                            placeholder="0"
                                            onChange={(e) => {
                                              const raw = e.target.value;
                                              const val = raw === '' ? 0 : parseFloat(raw) || 0;
                                              const updated = services.map(s => 
                                                s.id === service.id ? { ...s, basePrice: val } : s
                                              );
                                              updateServicesList(updated);
                                            }}
                                            className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs font-bold text-right outline-none transition-colors"
                                          />
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          {!searchTerm && (
                                            <div className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-grab active:cursor-grabbing mr-1">
                                              <GripVertical size={16} />
                                            </div>
                                          )}
                                          <button 
                                            onClick={() => deleteService(service.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 ml-2"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                          </tbody>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </table>
                </div>
                {services.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 font-medium italic">Your service catalog is empty. Import a CSV to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Service Bundles (Saved Setups) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
                    Saved Service Bundles ({ (settings?.dashboardSetups || []).length })
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Ready-to-use multi-service setups</p>
                </div>
              </div>

              {(settings?.dashboardSetups || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(settings?.dashboardSetups || []).map(setup => {
                    let totalSetupPrice = 0;
                    const setupServices = (setup.serviceIds || []).map(id => {
                      const srv = services.find(s => s.id === id);
                      if (srv) {
                        totalSetupPrice += srv.basePrice || 0;
                      }
                      return srv;
                    }).filter(Boolean) as RepairService[];

                    return (
                      <div key={setup.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 hover:shadow-md hover:border-indigo-500/30 transition-all flex flex-col justify-between group relative">
                        <button 
                          onClick={() => handleDeleteSetup(setup.id)}
                          className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Setup Bundle"
                        >
                          <Trash2 size={14} />
                        </button>

                        <div className="space-y-3">
                          <span className="text-xs font-black text-slate-800 max-w-[85%] block truncate">{setup.name}</span>
                          <div className="space-y-1.5">
                            {setupServices.map(srv => (
                              <div key={srv.id} className="flex justify-between items-center text-[10px] font-semibold text-slate-600">
                                <span className="truncate max-w-[160px]">{srv.name}</span>
                                <span className="font-mono text-slate-400 font-bold">${srv.basePrice.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Bundle Price</span>
                            <span className="text-sm font-black text-slate-900 leading-none mt-1.5">${totalSetupPrice.toFixed(2)}</span>
                          </div>
                          {onServicesSelectedForInvoice && (
                            <button 
                              onClick={() => onServicesSelectedForInvoice(setup.serviceIds)}
                              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-100"
                            >
                              <Play size={10} className="fill-white text-white" /> Draft Job
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 bg-white rounded-2xl flex flex-col items-center justify-center">
                  <Layers className="text-slate-300 w-10 h-10 mb-3 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No Saved Setup Bundles Yet</p>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-[280px] mt-1.5 text-center leading-relaxed">
                    Save frequent combinations (e.g. software setups, diagnostics) in your <span className="text-blue-500 font-bold cursor-pointer underline" onClick={() => setView('services')}>Services tab</span> by selecting multiple checkboxes, then click the orange <span className="bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-black font-semibold">Save Setup</span> button at the bottom screen action-bar!
                  </p>
                </div>
              )}
            </div>

            {/* Quick Launchpad (Pinned Brands) */}
            <div className="space-y-4 pt-6 border-t border-slate-100/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Pinned Manufacturer Brands</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Instant brand-preset manual or smart AI invoice creator</p>
                </div>
              </div>

              {(() => {
                const pinnedBrandIds = settings?.dashboardBrandIds || [];
                const pinnedBrands = brands.filter(b => pinnedBrandIds.includes(b.id));

                if (pinnedBrands.length === 0) {
                  return (
                    <div className="text-center py-8 border border-dashed border-slate-200 bg-white rounded-2xl flex flex-col items-center justify-center p-4">
                      <Smartphone className="text-slate-300 w-8 h-8 mb-2" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Brands Featured</p>
                      <p className="text-[9px] text-slate-400/60 max-w-[220px] mt-1 text-center">Pin manufacturer brands using the <span className="text-amber-500 font-bold cursor-pointer" onClick={() => setView('devices')}>pin icon next to each brand</span> inside Devices tab.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {pinnedBrands.map(brand => (
                      <div key={brand.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-all gap-3">
                        <div>
                          <span className="text-xs font-black text-slate-800 line-clamp-1">{brand.name}</span>
                          <p className="text-[8px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                            {brand.series.reduce((sum, s) => sum + s.models.length, 0)} models catalog
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-50">
                          {onServicesSelectedForInvoice ? (
                            <button
                              onClick={() => {
                                // Since it is brand shortcut, trigger invoice creator for this brand
                                onServicesSelectedForInvoice([]);
                              }}
                              className="w-full py-1.5 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-bold text-slate-600 transition-all uppercase tracking-wide flex items-center justify-center gap-1 border border-slate-100"
                            >
                              <Receipt size={10} /> Draft Job
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Quick Launchpad (Pinned Services) */}
            <div className="space-y-4 pt-6 border-t border-slate-100/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Pinned Repair Services</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Launch invoice with single-service shortcut</p>
                </div>
              </div>

              {(() => {
                const pinnedServiceIds = settings?.dashboardServiceIds || [];
                const pinnedServices = services.filter(s => pinnedServiceIds.includes(s.id));

                if (pinnedServices.length === 0) {
                  return (
                    <div className="text-center py-8 border border-dashed border-slate-200 bg-white rounded-2xl flex flex-col items-center justify-center p-4">
                      <Layers className="text-slate-300 w-8 h-8 mb-2" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Services Featured</p>
                      <p className="text-[9px] text-slate-400/60 max-w-[220px] mt-1 text-center">Pin favorite standard services using the <span className="text-amber-500 font-bold cursor-pointer" onClick={() => setView('services')}>pin icon column</span> inside Services tab.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {pinnedServices.map(service => (
                      <div key={service.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-all gap-3">
                        <div>
                          <span className="text-xs font-black text-slate-800 line-clamp-1">{service.name}</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              {service.category}
                            </span>
                            <span className="font-mono text-[10px] font-black text-slate-600">
                              ${service.basePrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-50">
                          {onServicesSelectedForInvoice && (
                            <button
                              onClick={() => onServicesSelectedForInvoice([service.id])}
                              className="w-full py-1.5 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-bold text-slate-600 transition-all uppercase tracking-wide flex items-center justify-center gap-1 border border-slate-100"
                            >
                              <Receipt size={10} /> Draft Job
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
