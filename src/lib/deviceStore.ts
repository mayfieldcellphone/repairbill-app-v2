import { Brand, ProductSeries, ProductModel } from './types';
import { BRANDS as INITIAL_BRANDS } from './brandData';

const STORAGE_KEY = 'honeybill_custom_devices';

export const getBrandCatalog = (): Brand[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const result = JSON.parse(JSON.stringify(INITIAL_BRANDS));
    result.sort((a: Brand, b: Brand) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    return result;
  }
  
  try {
    const customBrands: Brand[] = JSON.parse(saved);
    // If we have custom brands, we assume this is the source of truth for the list
    // but we still want to make sure it contains all the latest models/series from INITIAL_BRANDS 
    // if applicable, and any NEW initial brands that might have been added to code.
    
    const mergedMap = new Map<string, Brand>();
    INITIAL_BRANDS.forEach(b => mergedMap.set(b.id, JSON.parse(JSON.stringify(b))));
    
    // We'll build the final list based on the ORDER in customBrands
    const result: Brand[] = [];
    const processedIds = new Set<string>();

    customBrands.forEach(cb => {
      processedIds.add(cb.id);
      if (mergedMap.has(cb.id)) {
        const existing = mergedMap.get(cb.id)!;
        // Merge custom content into existing initial brand
        cb.series.forEach(cs => {
          const existingSeries = existing.series.find(s => s.id === cs.id);
          if (existingSeries) {
            cs.models.forEach(cm => {
              const existingModel = existingSeries.models.find(m => m.id === cm.id);
              if (!existingModel) {
                existingSeries.models.push(cm);
              } else {
                if (cm.order !== undefined) {
                  existingModel.order = cm.order;
                }
              }
            });
          } else {
            existing.series.push(cs);
          }
        });
        result.push(existing);
      } else {
        // purely custom brand
        result.push(cb);
      }
    });

    // Add any INITIAL_BRANDS that weren't in customBrands (e.g. newly added to code)
    INITIAL_BRANDS.forEach(b => {
      if (!processedIds.has(b.id)) {
        result.push(JSON.parse(JSON.stringify(b)));
      }
    });

    // Sort series and models but leave brand order as is
    const naturalSortDesc = (a: string, b: string) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
    const naturalSortAsc = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

    result.forEach(brand => {
      brand.series.sort((a, b) => naturalSortAsc(a.name, b.name));
      brand.series.forEach(series => {
        series.models.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return naturalSortDesc(a.name, b.name);
        });
      });
    });
    
    return result;
  } catch (e) {
    console.error('Error parsing custom devices', e);
    return INITIAL_BRANDS;
  }
};

export const saveBrandOrder = (brands: Brand[]) => {
  updateLocalStorage(brands);
};

export const saveCustomModel = (brandId: string, seriesId: string, modelName: string) => {
  const brands = getBrandCatalog();
  const brand = brands.find(b => b.id === brandId);
  if (!brand) return;
  
  let series = brand.series.find(s => s.id === seriesId);
  if (!series) {
    series = {
      id: seriesId,
      name: seriesId.charAt(0).toUpperCase() + seriesId.slice(1).replace(/-/g, ' '),
      models: []
    };
    brand.series.push(series);
  }
  
  const modelId = modelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  if (series.models.find(m => m.id === modelId)) return;
  
  series.models.push({
    id: modelId,
    name: modelName
  });
  
  // Filter only custom changes to save space? Nah, just save the whole merged state as custom overrides
  // Actually, let's just save the custom ones specifically
  updateLocalStorage(brands);
};

export const saveCustomBrand = (brandName: string) => {
  const brands = getBrandCatalog();
  const brandId = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  if (brands.find(b => b.id === brandId)) return;
  
  const newBrand: Brand = {
    id: brandId,
    name: brandName,
    series: [{ id: 'general', name: 'General', models: [] }]
  };
  
  brands.push(newBrand);
  updateLocalStorage(brands);
  return newBrand;
};

const updateLocalStorage = (brands: Brand[]) => {
  // We only really want to save what's DIFFERENT from INITIAL_BRANDS
  // Or just save everything. For simplicity with local storage part of one turn, let's save what's added.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
};
