import React, { useState, useRef } from 'react';
import { REPAIR_SERVICES as STATIC_SERVICES, getSavedServices } from '../lib/serviceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Laptop, Smartphone, Watch, Tablet, Download, Upload, Trash2, CheckCircle2, X, Plus, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Brand, RepairService } from '../lib/types';
import { motion, AnimatePresence } from 'motion/react';

export function CatalogView({ brands, onCatalogUpdate }: { 
  brands: Brand[], 
  onCatalogUpdate?: (data: { 
    brandName: string, 
    modelName?: string, 
    action: 'add_brand' | 'add_model' | 'remove_brand' | 'remove_model' | 'update_brand',
    updatedBrand?: Brand
  }) => void 
}) {
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || '');
  const selectedBrand = brands.find(b => b.id === (selectedBrandId || brands[0]?.id)) || brands[0];
  const [searchTerm, setSearchTerm] = useState('');
  const [newModelNames, setNewModelNames] = useState<Record<string, string>>({});
  const [view, setView] = useState<'devices' | 'services'>('devices');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [services, setServices] = useState<RepairService[]>(() => {
    return getSavedServices();
  });

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
    
    setServices(newServices);
    localStorage.setItem('honeybill_custom_services', JSON.stringify(newServices));
  };

  const toggleVisibility = (id: string) => {
    const updated = services.map(s => 
      s.id === id ? { ...s, hidden: !s.hidden } : s
    );
    setServices(updated);
    localStorage.setItem('honeybill_custom_services', JSON.stringify(updated));
  };

  const deleteService = (id: string) => {
    if (confirm('Delete this service from catalog?')) {
      const updated = services.filter(s => s.id !== id);
      setServices(updated);
      localStorage.setItem('honeybill_custom_services', JSON.stringify(updated));
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
    setServices(updated);
    localStorage.setItem('honeybill_custom_services', JSON.stringify(updated));
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
    setServices(updated);
    localStorage.setItem('honeybill_custom_services', JSON.stringify(updated));
    showNotification(`${selectedServices.length} services ${hide ? 'hidden' : 'made visible'}`, 'success');
  };

  const deleteSelectedServices = () => {
    if (selectedServices.length === 0) return;
    if (confirm(`Delete ${selectedServices.length} selected services?`)) {
      const updated = services.filter(s => !selectedServices.includes(s.id));
      setServices(updated);
      localStorage.setItem('honeybill_custom_services', JSON.stringify(updated));
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

        setServices(newServices);
        localStorage.setItem('honeybill_custom_services', JSON.stringify(newServices));
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
      setServices(STATIC_SERVICES);
      localStorage.removeItem('honeybill_custom_services');
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
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{view === 'devices' ? 'Product Catalog' : 'Repair Services Catalog'}</h2>
          <p className="text-sm text-slate-500">{view === 'devices' ? 'Global brand models and device specifications' : 'Manage your repair service price list'}</p>
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
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder={`Search ${view}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl bg-card border-border"
            />
          </div>

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
            <div className="space-y-2">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrandId(brand.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
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
              ))}
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedBrand.series.map((series) => {
                  const filteredModels = series.models.filter(m => 
                    m.name.toLowerCase().includes(searchTerm.toLowerCase())
                  );

                  if (searchTerm && filteredModels.length === 0) return null;

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
                        <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {filteredModels.map((model) => (
                            <div key={model.id} className="px-6 py-2.5 flex justify-between items-center hover:bg-slate-50/80 transition-colors group">
                              <span className="text-xs font-bold text-slate-700">{model.name}</span>
                              <div className="flex items-center gap-1.5">
                                {model.releaseYear && (
                                  <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    {model.releaseYear}
                                  </span>
                                )}
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                                  <button
                                    onClick={() => handleMoveModel(series.id, model.id, 'up')}
                                    disabled={series.models.indexOf(model) === 0}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 disabled:hover:bg-transparent"
                                    title="Move Up"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleMoveModel(series.id, model.id, 'down')}
                                    disabled={series.models.indexOf(model) === series.models.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 disabled:hover:bg-transparent"
                                    title="Move Down"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
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
                          ))}
                        </div>
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
        ) : (
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
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Default Price</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {services
                        .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.category.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((service) => (
                        <tr key={service.id} className={cn(
                          "hover:bg-slate-50 transition-colors group",
                          selectedServices.includes(service.id) && "bg-blue-50/50"
                        )}>
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
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-black text-slate-900">${service.basePrice.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => moveService(service.id, 'up')}
                                disabled={services.indexOf(service) === 0}
                                className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button 
                                onClick={() => moveService(service.id, 'down')}
                                disabled={services.indexOf(service) === services.length - 1}
                                className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ChevronDown size={16} />
                              </button>
                              <button 
                                onClick={() => deleteService(service.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 ml-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
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
        )}
      </div>
    </div>
  );
}
