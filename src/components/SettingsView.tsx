import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Palette, Type, Building2, Save, CreditCard, FileText, Check, Smartphone, Plus, Trash2, LayoutDashboard, Code, Copy, Zap, GripVertical, TrendingUp, Cpu } from 'lucide-react';
import { InvoiceSettings, Brand, ProductSeries, ProductModel, RepairService } from '../lib/types';
import { getBrandCatalog, saveCustomBrand, saveCustomModel, saveBrandOrder } from '../lib/deviceStore';
import { REPAIR_SERVICES, getSavedServices } from '../lib/serviceData';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import firebaseConfig from '../../firebase-applet-config.json';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface SettingsViewProps {
  settings: InvoiceSettings;
  setSettings: (settings: InvoiceSettings) => void;
  onBrandsReordered?: (brands: Brand[]) => void;
  onCatalogUpdate?: (data: { 
    brandName: string, 
    modelName?: string, 
    action: 'add_brand' | 'add_model' | 'remove_brand' | 'remove_model' | 'update_brand',
    updatedBrand?: Brand 
  }) => void;
}

export function SettingsView({ settings, setSettings, onBrandsReordered, onCatalogUpdate }: SettingsViewProps) {
  const { user, profile } = useAuth();
  const [localSettings, setLocalSettings] = useState<InvoiceSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await setSettings(localSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo file is too large. Please use an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLocalSettings({ ...localSettings, logo: base64, showLogo: true });
    };
    reader.readAsDataURL(file);
  };

  const fonts = [
    { value: 'sans', label: 'Modern Sans' },
    { value: 'serif', label: 'Classic Serif' },
    { value: 'mono', label: 'Professional Mono' },
  ];

  const colors = [
    { name: 'Blue', value: '#2563eb' },
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Slate', value: '#334155' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Orange', value: '#ea580c' },
  ];

  const templates = [
    { id: 'modern', name: 'Modern UI', description: 'Bold, structured, and colorful' },
    { id: 'classic', name: 'Classic ERP', description: 'Traditional and professional' },
    { id: 'minimalist', name: 'Subtle Minimal', description: 'Clean and focus on data' },
  ];

  const themes = [
    { id: 'modern', name: 'Modern Pro', description: 'Clean slate & blue professional look', color: '#2563eb' },
    { id: 'cyber', name: 'Cyber Dark', description: 'Deep slate with neon accents', color: '#0ea5e9' },
    { id: 'minimalist', name: 'Minimal Studio', description: 'Soft tones, serif fonts, edge-to-edge', color: '#18181b' },
  ];

  const formatPrice = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: settings.currency && settings.currency.length === 3 ? settings.currency : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(amount));
    } catch (e) {
      return `$${amount.toLocaleString()}`;
    }
  };

  // Preview Data Calculations
  const previewItems = [
    { desc: 'iPhone 17 Pro Max - Screen Repair', qty: 1, price: 299 },
    { desc: 'Privacy Screen Protector G3', qty: 2, price: 45 },
  ];

  const calculateItemAmount = (price: number, qty: number) => {
    const baseAmount = price * qty;
    return localSettings.taxInclusive ? baseAmount : baseAmount * (1 + localSettings.taxRate / 100);
  };

  const totalInclTax = previewItems.reduce((sum, item) => sum + calculateItemAmount(item.price, item.qty), 0);
  const taxAmount = totalInclTax - (totalInclTax / (1 + localSettings.taxRate / 100));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tighter">System Settings</h2>
          <p className="text-muted-foreground font-medium">Fine-tune your brand identity and document generation engine</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setLocalSettings(settings)}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
          >
            Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98]",
              saveSuccess ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50"
            )}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check size={18} />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? 'Synchronizing...' : saveSuccess ? 'Saved!' : 'Save Progress'}
          </button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Dashboard Sidebar */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-8 space-y-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-[2rem] border border-border/50 p-2 shadow-sm">
              <TabsList className="bg-transparent flex flex-wrap lg:flex-col h-auto w-full p-0 gap-1 items-stretch">
                {[
                  { id: 'branding', icon: Palette, label: 'Identity' },
                  { id: 'templates', icon: FileText, label: 'Layouts' },
                  { id: 'business', icon: Building2, label: 'Profile' },
                  { id: 'catalog', icon: Smartphone, label: 'Catalog' },
                  { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
                  { id: 'financial', icon: CreditCard, label: 'Finance' },
                  { id: 'integration', icon: Zap, label: 'Website' },
                  { id: 'ai-voice', icon: Cpu, label: 'AI Voice' },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id} 
                    className="flex-1 lg:flex-none justify-start px-5 py-4 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground hover:bg-muted font-bold text-[10px] uppercase tracking-widest transition-all border-none"
                  >
                    <tab.icon size={18} className="mr-3" /> 
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </aside>

          {/* Settings Content & Preview Grid */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
              {/* Form Controls */}
              <div className="xl:col-span-5 space-y-6">

            <TabsContent value="branding" className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-20 h-20 bg-muted rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground overflow-hidden",
                      localSettings.logo && "border-none"
                    )}>
                      {localSettings.logo ? (
                        <img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <Palette size={24} className="mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">No Logo</span>
                        </>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Upload your company logo for the invoice header (Max 2MB).</p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Browse files...
                        </button>
                        {localSettings.logo && (
                          <button 
                            onClick={() => setLocalSettings({ ...localSettings, logo: undefined, showLogo: false })}
                            className="text-xs font-bold text-destructive hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground">Primary Brand Color</Label>
                  <div className="flex gap-3 flex-wrap">
                    {colors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setLocalSettings({ ...localSettings, primaryColor: c.value })}
                        className={cn(
                          "w-10 h-10 rounded-full border-4 transition-all scale-100 active:scale-90",
                          localSettings.primaryColor === c.value ? "border-card shadow-lg shadow-black/20 ring-2 ring-border" : "border-transparent"
                        )}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground">Company Name Display</Label>
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card">
                    <div>
                      <h4 className="font-bold text-sm">Hide Business Name</h4>
                      <p className="text-xs text-muted-foreground">Only show logo on the invoice header</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={localSettings.hideCompanyName}
                        onChange={(e) => setLocalSettings({ ...localSettings, hideCompanyName: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {!localSettings.hideCompanyName && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Font Size</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'sm', label: 'Small' },
                          { id: 'md', label: 'Medium' },
                          { id: 'lg', label: 'Large' },
                          { id: 'xl', label: 'X-Large' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setLocalSettings({ ...localSettings, companyNameSize: s.id as any })}
                            className={cn(
                              "px-3 py-2 text-center rounded-lg border text-xs transition-all",
                              localSettings.companyNameSize === s.id ? "bg-primary/10 border-primary/30 text-primary font-bold" : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground">Typography Style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {fonts.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setLocalSettings({ ...localSettings, fontFamily: f.value as any })}
                        className={cn(
                          "px-4 py-3 text-center rounded-xl border text-xs transition-all",
                          localSettings.fontFamily === f.value ? "bg-primary/10 border-primary/30 text-primary font-bold" : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold text-foreground">Invoice Footer Message</Label>
                <textarea
                  className="w-full bg-card border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="Terms, conditions, or a thank you note..."
                  value={localSettings.footerMessage}
                  onChange={(e) => setLocalSettings({ ...localSettings, footerMessage: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-4">
                <Label className="text-sm font-bold text-foreground">App Interface Style</Label>
                <div className="grid grid-cols-1 gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setLocalSettings({ ...localSettings, appTheme: t.id as any })}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                        localSettings.appTheme === t.id 
                          ? "bg-primary/5 border-primary/30 ring-2 ring-primary/10" 
                          : "bg-card border-border hover:border-border/80"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        localSettings.appTheme === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <LayoutDashboard size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground text-sm">{t.name}</h4>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                      {localSettings.appTheme === t.id && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold text-foreground">Creation Workflow Order</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'brand-first', label: 'Device then Service', desc: 'Brand > Model > Job' },
                    { id: 'service-first', label: 'Service then Device', desc: 'Job > Brand > Model' }
                  ].map((flow) => (
                    <button
                      key={flow.id}
                      onClick={() => setLocalSettings({ ...localSettings, creationFlowOrder: flow.id as any })}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all",
                        localSettings.creationFlowOrder === flow.id 
                          ? "bg-primary/5 border-primary/30 ring-2 ring-primary/10" 
                          : "bg-card border-border hover:border-border/80"
                      )}
                    >
                      <h4 className="font-bold text-foreground text-[11px] uppercase tracking-widest">{flow.label}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1">{flow.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold text-foreground">Invoice PDF Template</Label>
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setLocalSettings({ ...localSettings, template: t.id as any })}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                      localSettings.template === t.id 
                        ? "bg-primary/5 border-primary/30 ring-2 ring-primary/10" 
                        : "bg-card border-border hover:border-border/80"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      localSettings.template === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{t.name}</h4>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                    {localSettings.template === t.id && (
                      <div className="ml-auto w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check size={14} className="text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

            <TabsContent value="business" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Business Name</Label>
                  <Input 
                    value={localSettings.companyName}
                    onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Billing Email</Label>
                  <Input 
                    value={localSettings.email}
                    onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })}
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Contact Number</Label>
                  <Input 
                    value={localSettings.phone}
                    onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Website</Label>
                  <Input 
                    value={localSettings.website}
                    onChange={(e) => setLocalSettings({ ...localSettings, website: e.target.value })}
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-bold text-foreground">Physical Address</Label>
                  <Input 
                    value={localSettings.address}
                    onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="catalog" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <CatalogManager settings={localSettings} onBrandsReordered={onBrandsReordered} onCatalogUpdate={onCatalogUpdate} />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <DashboardManager settings={localSettings} setSettings={setLocalSettings} />
            </TabsContent>

            <TabsContent value="financial" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Currency Code</Label>
                  <select 
                    value={localSettings.currency}
                    onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                    className="w-full bg-card border border-border rounded-xl h-11 px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="NZD">NZD ($)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground font-bold px-1 uppercase tracking-widest">Must be a 3-letter ISO code</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">GST Rate (%)</Label>
                  <Input 
                    type="number"
                    value={localSettings.taxRate}
                    onChange={(e) => setLocalSettings({ ...localSettings, taxRate: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-2 flex items-center border border-border rounded-xl p-3 h-11 mt-7 bg-card">
                  <input
                    type="checkbox"
                    id="taxInclusive"
                    checked={localSettings.taxInclusive}
                    onChange={(e) => setLocalSettings({ ...localSettings, taxInclusive: e.target.checked })}
                    className="mr-3 w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <Label htmlFor="taxInclusive" className="text-sm font-bold text-foreground cursor-pointer flex-1 mb-0">GST Inclusive Pricing</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Invoice Prefix</Label>
                  <Input 
                    value={localSettings.invoicePrefix}
                    onChange={(e) => setLocalSettings({ ...localSettings, invoicePrefix: e.target.value })}
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Quote Prefix</Label>
                  <Input 
                    value={localSettings.estimatePrefix}
                    onChange={(e) => setLocalSettings({ ...localSettings, estimatePrefix: e.target.value })}
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Default Warranty</Label>
                  <Input 
                    value={localSettings.warrantyPeriod}
                    onChange={(e) => setLocalSettings({ ...localSettings, warrantyPeriod: e.target.value })}
                    placeholder="e.g. 90 Days"
                    className="rounded-xl h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-bold text-foreground">Default Invoice Notes</Label>
                  <textarea
                    className="w-full bg-card border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary min-h-[80px]"
                    placeholder="Terms, conditions, or a thank you note..."
                    value={localSettings.notes}
                    onChange={(e) => setLocalSettings({ ...localSettings, notes: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-card rounded-2xl p-6 text-card-foreground space-y-6 border border-border">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Code size={20} />
                   </div>
                   <div>
                     <h3 className="font-black text-sm uppercase tracking-widest">Connect Your Website</h3>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase">Bring leads/quotes from your website to your RepairBill inbox</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Your Unique Web Integration Key</p>
                    <div className="flex items-center justify-between gap-3 bg-background p-3 rounded-lg border border-border">
                      <code className="text-xs text-primary font-mono truncate">{profile?.apiKey || 'Not generated yet'}</code>
                      <button 
                        onClick={() => {
                          if (profile?.apiKey) {
                            navigator.clipboard.writeText(profile.apiKey);
                            alert("API Key copied to clipboard!");
                          }
                        }}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                      >
                        <Copy size={14} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Step 2: API Integration Guide</p>
                      <button 
                        onClick={async () => {
                          if (!profile?.apiKey) return;
                          try {
                            const response = await fetch('/api/web-integration/leads', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${profile.apiKey}`
                                },
                                body: JSON.stringify({
                                    customerName: "Integration Reality Check",
                                    customerEmail: "test@repairbill.pro",
                                    message: "This is a test lead sent via your API key. If you see this, your website integration is ready!",
                                    type: "quote"
                                })
                            });
                            if (response.ok) alert("Success! Test lead has been sent to your Inbox.");
                            else alert("Integration test failed. Check console for details.");
                          } catch(e) {
                            console.error(e);
                            alert("Failed to send test lead. Please check your connection.");
                          }
                        }}
                        className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        Test API Connection
                      </button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Endpoint</Label>
                        <div className="bg-muted p-3 rounded-lg text-xs font-mono text-foreground border border-border">
                            POST {window.location.origin}/api/web-integration/leads
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Easy Integration Snippet (Paste into Website)</Label>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-300 relative overflow-hidden group">
                            <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
{`// Add this to your website contact form handler
fetch("${window.location.origin}/api/web-integration/leads", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${profile?.apiKey || 'YOUR_API_KEY'}"
  },
  body: JSON.stringify({
    customerName: document.getElementById("name").value,
    customerEmail: document.getElementById("email").value,
    message: document.getElementById("message").value,
    type: "quote" // or "contact"
  })
}).then(res => console.log("Lead synced to RepairBill!"));`}
                            </pre>
                            <button 
                                onClick={() => {
                                    const code = `fetch("${window.location.origin}/api/web-integration/leads", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${profile?.apiKey || 'YOUR_API_KEY'}"
  },
  body: JSON.stringify({
    customerName: "Customer Name",
    customerEmail: "email@example.com",
    message: "I need a repair...",
    type: "quote"
  })
});`;
                                    navigator.clipboard.writeText(code);
                                    alert("Snippet copied!");
                                }}
                                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                        <p className="text-[9px] text-muted-foreground italic">Combine this with your existing contact form logic for instant synchronization.</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed JSON Payload Reference</Label>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-300">
                            <pre className="text-[10px] font-mono leading-relaxed">
{`{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "0400 123 456",
  "message": "I need a screen repair for my iPhone 15 Pro",
  "type": "quote", // options: contact, quote, booking
  "metadata": {
    "source": "homepage_form"
  }
}`}
                            </pre>
                        </div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                     <p className="text-xs text-primary leading-relaxed font-medium">
                       <strong>Developer Tip:</strong> Use the <code>Authorization</code> header with <code>Bearer YOUR_API_KEY</code> to authenticate requests from your website or custom forms.
                     </p>
                  </div>
                </div>
              </div>

              {/* Website Lead Widget Integration */}
              <div className="bg-card rounded-2xl p-6 text-card-foreground space-y-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-widest">Live Widget Connection</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">External widget & third-party lead sync</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Lead / Sync API Key</Label>
                    <Input 
                      type="password"
                      placeholder="sync_live_..."
                      value={localSettings.charlaApiKey || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, charlaApiKey: e.target.value })}
                      className="rounded-xl h-11 bg-background border-border"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium italic">
                      If you use an external lead ingestion widget or custom live forms, enter the API key here to sync leads automatically.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-voice" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-card rounded-2xl p-6 text-card-foreground space-y-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-card-foreground">AI Intelligence & Voice</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Configure language models for automated intake & repair summaries</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select AI Provider</Label>
                    <div className="flex bg-muted/60 p-1.5 rounded-2xl border border-border/40">
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, aiProvider: 'gemini' })}
                        className={cn(
                          "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2",
                          (!localSettings.aiProvider || localSettings.aiProvider === 'gemini')
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                            : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                        )}
                      >
                        Google Gemini
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, aiProvider: 'openai' })}
                        className={cn(
                          "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2",
                          (localSettings.aiProvider === 'openai')
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                            : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                        )}
                      >
                        OpenAI
                      </button>
                    </div>
                  </div>

                  {(!localSettings.aiProvider || localSettings.aiProvider === 'gemini') ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom Gemini API Key</Label>
                        <Input
                          type="password"
                          placeholder="AIzaSy..."
                          value={localSettings.geminiApiKey || ''}
                          onChange={(e) => setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })}
                          className="rounded-xl h-11 bg-background border-border"
                        />
                        <p className="text-[10px] text-muted-foreground font-medium italic">
                          If omitted, the default system Gemini API endpoint will be leveraged.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gemini Model Name</Label>
                        <Input
                          type="text"
                          placeholder="gemini-3.5-flash"
                          value={localSettings.geminiModel || 'gemini-3.5-flash'}
                          onChange={(e) => setLocalSettings({ ...localSettings, geminiModel: e.target.value })}
                          className="rounded-xl h-11 bg-background border-border"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">OpenAI API Key</Label>
                        <Input
                          type="password"
                          placeholder="sk-..."
                          value={localSettings.openaiApiKey || ''}
                          onChange={(e) => setLocalSettings({ ...localSettings, openaiApiKey: e.target.value })}
                          className="rounded-xl h-11 bg-background border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom Endpoint / Proxy URL (Optional)</Label>
                        <Input
                          type="text"
                          placeholder="e.g. https://openrouter.ai/api/v1"
                          value={localSettings.openaiEndpoint || ''}
                          onChange={(e) => setLocalSettings({ ...localSettings, openaiEndpoint: e.target.value })}
                          className="rounded-xl h-11 bg-background border-border"
                        />
                        <p className="text-[10px] text-muted-foreground font-medium italic">
                          Configure a custom base path if utilizing OpenRouter, DeepSeek proxies, or an internal enterprise bridge.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                     <p className="text-xs text-primary leading-relaxed font-semibold">
                       <strong>Intake Co-pilot:</strong> This model setup empowers your technician to automatically scan phone model configurations, extract customer transcripts, and auto-recommend screen vs. battery repair quotes!
                     </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>

          {/* Live Preview - A4 Simulation */}
          <div className="xl:col-span-7 space-y-6 xl:sticky xl:top-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
                  <Eye size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block leading-none">Simulation</span>
                  <span className="text-sm font-bold text-foreground">Tax Invoice Simulation</span>
                </div>
              </div>
              <button 
                onClick={() => window.print()}
                className="text-[10px] font-bold uppercase tracking-widest bg-muted/50 hover:bg-muted px-4 py-2 rounded-xl text-muted-foreground transition-all border border-border/40 backdrop-blur-sm"
              >
                Print Preview
              </button>
            </div>
            
            <div className="bg-muted/20 p-4 sm:p-12 flex justify-center items-start rounded-[2.5rem] border border-border/50 min-h-[700px] overflow-hidden relative group/preview">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
              
              {/* A4 Sheet Wrapper */}
              <div className="w-full flex items-start justify-center origin-top transform scale-[0.65] sm:scale-[0.8] md:scale-[0.95] xl:scale-100 transition-transform duration-500">
                <div className={cn(
                  "bg-white shadow-[0_40px_80px_-12px_rgba(0,0,0,0.15)] p-12 w-[595px] min-h-[842px] flex flex-col relative text-slate-900",
                  localSettings.fontFamily === 'serif' ? "font-serif" : localSettings.fontFamily === 'mono' ? "font-mono" : "font-sans"
                )}>
              {localSettings.template === 'modern' ? (
                /* MODERN TEMPLATE */
                <>
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      {localSettings.logo ? (
                        <img src={localSettings.logo} alt="Logo" className="w-auto h-16 mb-4 object-contain" />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg text-2xl font-black"
                          style={{ backgroundColor: localSettings.primaryColor }}
                        >
                          HB
                        </div>
                      )}
                      {!localSettings.hideCompanyName && (
                        <h3 className={cn(
                          "font-black tracking-tight",
                          localSettings.companyNameSize === 'sm' ? "text-lg" :
                          localSettings.companyNameSize === 'md' ? "text-xl" :
                          localSettings.companyNameSize === 'xl' ? "text-3xl" : "text-2xl"
                        )}>{localSettings.companyName}</h3>
                      )}
                      <div className="text-xs text-slate-500 mt-2 space-y-1">
                        <p>{localSettings.address}</p>
                        <p>{localSettings.phone} • {localSettings.website}</p>
                        <p>{localSettings.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-4xl font-black text-slate-200 tracking-tighter mb-2 italic">TAX INVOICE</h1>
                      <p className="text-sm font-bold">{localSettings.invoicePrefix}2026-1024</p>
                      <div className="mt-4 text-xs text-slate-500">
                        <p>Date: May 05, 2026</p>
                        <p>Due: May 19, 2026</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-12">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Bill To</p>
                    <div className="text-sm">
                      <p className="font-bold text-foreground">Johnathan Doe</p>
                      <p className="text-muted-foreground">454 Market St, San Francisco, CA</p>
                      <p className="text-muted-foreground">john.doe@example.com</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="grid grid-cols-12 border-b-2 border-foreground pb-3 mb-4 text-[10px] font-bold text-foreground uppercase">
                      <div className="col-span-7 px-1">Description</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-3 text-right">Amount</div>
                    </div>
                    <div className="space-y-4">
                      {previewItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-sm py-1">
                          <div className="col-span-7 px-1">
                            <p className="font-bold text-foreground">{item.desc}</p>
                            <p className="text-[10px] text-muted-foreground italic">Hardware Service</p>
                          </div>
                          <div className="col-span-2 text-center font-medium bg-muted rounded py-1 text-foreground">{item.qty}</div>
                          <div className="col-span-3 text-right font-black text-foreground">{formatPrice(calculateItemAmount(item.price, item.qty))}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-border flex justify-end">
                    <div className="w-64 space-y-2 text-foreground">
                      <div className="flex justify-between items-center pt-4 border-t-2 border-foreground mt-2">
                        <span className="text-xs font-bold uppercase">
                          Total Due (Inc. GST)
                        </span>
                        <span className="text-2xl font-black" style={{ color: localSettings.primaryColor }}>
                          {formatPrice(totalInclTax)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : localSettings.template === 'classic' ? (
                /* CLASSIC TEMPLATE */
                <div className="border-4 border-foreground p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-center border-b-4 border-foreground pb-8 mb-8">
                    <div className="flex items-center gap-4">
                       {localSettings.logo && <img src={localSettings.logo} alt="Logo" className="w-12 h-12 object-contain" />}
                       <h1 className="text-5xl font-serif font-black tracking-tighter text-foreground">TAX INVOICE</h1>
                    </div>
                    <div className="text-right font-serif text-foreground">
                      {!localSettings.hideCompanyName && (
                        <p className={cn(
                          "font-bold",
                          localSettings.companyNameSize === 'sm' ? "text-sm" :
                          localSettings.companyNameSize === 'lg' ? "text-lg" :
                          localSettings.companyNameSize === 'xl' ? "text-xl" : "text-base"
                        )}>{localSettings.companyName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{localSettings.address}</p>
                      <p className="text-[10px] text-muted-foreground/70">{localSettings.website}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 mb-12 text-xs font-serif text-foreground">
                    <div>
                      <h4 className="font-bold border-b border-border mb-2 uppercase tracking-tighter">Bill From</h4>
                      <p className="font-medium">{localSettings.email}</p>
                      <p>{localSettings.phone}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold border-b border-border mb-2 uppercase tracking-tighter">Order Info</h4>
                      <p>No: {localSettings.invoicePrefix}2026-1024</p>
                      <p>Date: 05/05/2026</p>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse font-serif flex-1">
                    <thead className="bg-foreground text-background text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-foreground">
                      {previewItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-border">
                          <td className="p-2 font-bold italic">{item.desc}</td>
                          <td className="p-2 text-center bg-muted/30">{item.qty}</td>
                          <td className="p-2 text-right">{formatPrice(calculateItemAmount(item.price, 1))}</td>
                          <td className="p-2 text-right font-bold">{formatPrice(calculateItemAmount(item.price, item.qty))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-8 flex justify-end font-serif text-foreground">
                    <div className="w-48 space-y-1">
                      <div className="flex justify-between border-t-2 border-foreground pt-1 font-bold">
                        <span>Total (Inc. GST):</span>
                        <span>{formatPrice(totalInclTax)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MINIMALIST TEMPLATE */
                <div className="flex-1 flex flex-col font-sans tracking-tight text-foreground">
                  <div className="flex justify-between items-start mb-20">
                    {localSettings.logo ? (
                      <img src={localSettings.logo} alt="Logo" className="w-10 h-10 object-contain grayscale" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ring-1 ring-border/50" style={{ backgroundColor: localSettings.primaryColor }}>
                        <LogoIcon />
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">REF NO</p>
                      <p className="text-lg font-medium">{localSettings.invoicePrefix}2026-1024</p>
                    </div>
                  </div>

                  <div className="mb-20">
                    <h1 className="text-6xl font-thin text-muted-foreground/30 -ml-1 mb-8 italic">TAX INVOICE</h1>
                    <div className="grid grid-cols-2 gap-8 text-xs">
                      <div className="flex-1">
                        <p className="font-black text-foreground mb-4 uppercase tracking-widest text-[9px] border-b border-border pb-1">Provider</p>
                        {!localSettings.hideCompanyName && (
                          <p className={cn(
                            "font-bold text-foreground",
                            localSettings.companyNameSize === 'sm' ? "text-sm" :
                            localSettings.companyNameSize === 'lg' ? "text-lg" :
                            localSettings.companyNameSize === 'xl' ? "text-xl" : "text-base"
                          )}>{localSettings.companyName}</p>
                        )}
                        <p className="text-muted-foreground mt-1">{localSettings.address}</p>
                        <p className="text-muted-foreground">{localSettings.phone}</p>
                        <p className="text-muted-foreground">{localSettings.website}</p>
                        <p className="text-muted-foreground">{localSettings.email}</p>
                      </div>
                      <div>
                        <p className="font-black text-foreground mb-4 uppercase tracking-widest text-[9px] border-b border-border pb-1">Recipient</p>
                        <p className="text-foreground">Johnathan Doe</p>
                        <p className="text-muted-foreground">john.doe@example.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    {previewItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-end border-b border-border pb-4 transition-colors hover:bg-muted/5 group">
                        <span className="text-sm font-medium group-hover:pl-2 transition-all">{item.desc}</span>
                        <span className="text-sm font-bold">{formatPrice(calculateItemAmount(item.price, item.qty))}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-20">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Total Amount (Inc. GST)</span>
                      <span className="text-4xl font-black italic">{formatPrice(totalInclTax)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-16">
                <p className="text-[10px] text-muted-foreground italic mb-8 border-l-2 border-primary/30 pl-4 py-1">
                  {localSettings.footerMessage}
                </p>
                <div className="flex justify-between items-end">
                  <div className="text-[10px] text-muted-foreground font-medium">
                    <p className="uppercase tracking-widest opacity-50">Generated by RepairBill ERP</p>
                    <p>Page 1 of 1</p>
                  </div>
                  <div className="w-48 h-[2px] bg-border/40"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</Tabs>
</div>
  );
}

interface DashboardManagerProps {
  settings: InvoiceSettings;
  setSettings: (settings: InvoiceSettings) => void;
}

function DashboardManager({ settings, setSettings }: DashboardManagerProps) {
  const [services, setServices] = useState<RepairService[]>(() => {
    return getSavedServices();
  });

  const toggleServiceDashboard = (serviceId: string) => {
    const currentList = settings.dashboardServiceIds || [];
    const isActive = currentList.includes(serviceId);
    let newList;
    if (isActive) {
      newList = currentList.filter(id => id !== serviceId);
    } else {
      newList = [...currentList, serviceId];
    }
    setSettings({ ...settings, dashboardServiceIds: newList });
  };

  return (
    <div className="bg-card border border-border shadow-sm rounded-3xl p-6 md:p-8 space-y-6">
      <div>
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <TrendingUp className="text-primary" size={24} />
        </div>
        <h3 className="text-2xl font-black text-foreground tracking-tight">Dashboard Settings</h3>
        <p className="text-muted-foreground font-medium">Select quick access services to be featured on your main operational dashboard.</p>
      </div>

      <div className="border-t border-border pt-6 space-y-6">
        <div>
          <Label className="text-sm font-bold text-foreground mb-4 block">Quick Services Display</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {services.map(service => {
              const isSelected = (settings.dashboardServiceIds || []).includes(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleServiceDashboard(service.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left flex justify-between items-center transition-all",
                    isSelected 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold", 
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {service.name}
                  </span>
                  <div className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-transparent border border-border"
                  )}>
                    <Check size={12} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CatalogManagerProps {
  settings: InvoiceSettings;
  onBrandsReordered?: (brands: Brand[]) => void;
  onCatalogUpdate?: (data: { 
    brandName: string, 
    modelName?: string, 
    action: 'add_brand' | 'add_model' | 'remove_brand' | 'remove_model' | 'update_brand',
    updatedBrand?: Brand 
  }) => void;
}

function CatalogManager({ settings, onBrandsReordered, onCatalogUpdate }: CatalogManagerProps) {
  const [brands, setBrands] = useState<Brand[]>(() => getBrandCatalog());
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(brands);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Add order property to each brand based on its new position
    const orderedItems = items.map((brand, index) => ({
      ...brand,
      order: index
    }));
    
    setBrands(orderedItems);
    saveBrandOrder(orderedItems);
    if (onBrandsReordered) {
      onBrandsReordered(orderedItems);
    }
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    const trimmed = newBrandName.trim();
    const newBrand = saveCustomBrand(trimmed);
    setBrands(getBrandCatalog());
    if (onCatalogUpdate && newBrand) {
      onCatalogUpdate({
        brandName: trimmed,
        action: 'add_brand'
      });
    }
    setNewBrandName('');
  };

  const handleAddModel = (seriesId: string) => {
    if (!selectedBrand || !newModelName.trim()) return;
    const trimmedModel = newModelName.trim();
    saveCustomModel(selectedBrand.id, seriesId, trimmedModel);
    const updatedBrands = getBrandCatalog();
    setBrands(updatedBrands);
    const updatedBrand = updatedBrands.find(b => b.id === selectedBrand.id);
    if (onCatalogUpdate && updatedBrand) {
      onCatalogUpdate({
        brandName: updatedBrand.name,
        modelName: trimmedModel,
        action: 'add_model',
        updatedBrand
      });
    }
    setNewModelName('');
  };

  const handleDeleteBrand = (id: string) => {
    const brandToDelete = brands.find(b => b.id === id);
    const updated = brands.filter(b => b.id !== id);
    localStorage.setItem('honeybill_custom_devices', JSON.stringify(updated));
    setBrands(updated);
    if (onCatalogUpdate && brandToDelete) {
      onCatalogUpdate({
        brandName: brandToDelete.name,
        action: 'remove_brand'
      });
    }
    if (selectedBrand?.id === id) setSelectedBrand(null);
  };

  return (
    <div className="space-y-6">
      {!selectedBrand ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="e.g. Nothing" 
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="rounded-xl bg-card border-border"
            />
            <button 
              onClick={handleAddBrand}
              className="p-3 rounded-xl text-primary-foreground shadow-sm"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Plus size={20} />
            </button>
          </div>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="brands">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 gap-2"
                >
                  {brands.map((brand, index) => (
                    <Draggable key={brand.id} draggableId={brand.id} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all cursor-pointer group",
                            snapshot.isDragging && "shadow-2xl ring-2 ring-primary/20 border-primary z-50 bg-card/90 backdrop-blur-md"
                          )}
                          onClick={() => setSelectedBrand(brand)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              {...provided.dragHandleProps}
                              className="p-1 hover:bg-muted rounded text-muted-foreground/30 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical size={16} />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {brand.name[0]}
                            </div>
                            <span className="font-bold text-foreground/90">{brand.name}</span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                              {brand.series.reduce((acc, s) => acc + s.models.length, 0)} models
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteBrand(brand.id); }}
                              className="p-2 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                            <Eye size={16} className="text-muted-foreground/40" />
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
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => setSelectedBrand(null)}
              className="p-2 bg-muted rounded-lg text-muted-foreground hover:bg-muted/80"
            >
              <Smartphone size={16} />
            </button>
            <h4 className="font-bold text-foreground">{selectedBrand.name} Models</h4>
          </div>

          {selectedBrand.series.map(series => (
            <div key={series.id} className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">{series.name}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {series.models.map(model => (
                  <div key={model.id} className="bg-card px-3 py-2 rounded-xl border border-border text-xs font-medium text-foreground/80 flex justify-between items-center group">
                    {model.name}
                    <button 
                      onClick={() => {
                        const updatedBrands = brands.map(b => {
                          if (b.id === selectedBrand.id) {
                            return {
                              ...b,
                              series: b.series.map(s => {
                                if (s.id === series.id) {
                                  return { ...s, models: s.models.filter(m => m.id !== model.id) };
                                }
                                return s;
                              })
                            };
                          }
                          return b;
                        });
                        localStorage.setItem('honeybill_custom_devices', JSON.stringify(updatedBrands));
                        setBrands(updatedBrands);
                        setSelectedBrand(updatedBrands.find(b => b.id === selectedBrand.id) || null);
                      }}
                      className="text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Input 
                  placeholder="New model name..." 
                  className="rounded-xl h-9 text-xs bg-card border-border"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddModel(series.id)}
                />
                <button 
                  onClick={() => handleAddModel(series.id)}
                  className="p-2 rounded-xl text-primary-foreground shadow-sm flex-shrink-0"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
    </svg>
  );
}
