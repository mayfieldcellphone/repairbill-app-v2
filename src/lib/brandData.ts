import { Brand } from './types';

const DEVICES_RAW: Record<string, { models: string[] }> = {
  "Apple iPhone": { models: [
    "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Plus", "iPhone 17",
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16", 
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15", 
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14", 
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 Mini", "iPhone 13", 
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 Mini", "iPhone 12", 
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
    "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7",
    "iPhone 6S Plus", "iPhone 6S", "iPhone 6 Plus", "iPhone 6",
    "iPhone SE (3rd Gen)", "iPhone SE (2nd Gen)", "iPhone SE (1st Gen)"
  ] },
  "Apple iPad": { models: [
    "iPad Pro 13\" (M4)", "iPad Pro 11\" (M4)", "iPad Air 13\" (M2)", "iPad Air 11\" (M2)", 
    "iPad Pro 12.9\" (6th Gen)", "iPad Pro 12.9\" (5th Gen)", "iPad Pro 12.9\" (4th Gen)", "iPad Pro 12.9\" (3rd Gen)",
    "iPad Pro 11\" (4th Gen)", "iPad Pro 11\" (3rd Gen)", "iPad Pro 11\" (2nd Gen)", "iPad Pro 11\" (1st Gen)",
    "iPad Air (5th Gen)", "iPad Air (4th Gen)", "iPad Air (3rd Gen)",
    "iPad (10th Gen)", "iPad (9th Gen)", "iPad (8th Gen)", "iPad (7th Gen)",
    "iPad mini (6th Gen)", "iPad mini (5th Gen)"
  ] },
  "Apple MacBook": { models: [
    "MacBook Pro 16\" (M3 Max/Pro)", "MacBook Pro 16\" (M2 Max/Pro)", "MacBook Pro 16\" (M1 Max/Pro)",
    "MacBook Pro 14\" (M3 Max/Pro/Standard)", "MacBook Pro 14\" (M2 Max/Pro)", "MacBook Pro 14\" (M1 Max/Pro)",
    "MacBook Pro 13\" (M2)", "MacBook Pro 13\" (M1)", "MacBook Pro 13\" (Intel)",
    "MacBook Air 15\" (M3)", "MacBook Air 15\" (M2)",
    "MacBook Air 13\" (M3)", "MacBook Air 13\" (M2)", "MacBook Air 13\" (M1)", "MacBook Air 13\" (Intel)"
  ] },
  "Samsung Galaxy S": { models: [
    "Galaxy S26 Ultra", "Galaxy S26+", "Galaxy S26",
    "Galaxy S25 Ultra", "Galaxy S25+", "Galaxy S24 FE", "Galaxy S25", 
    "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", 
    "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23 FE", "Galaxy S23", 
    "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22",
    "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21 FE", "Galaxy S21",
    "Galaxy S20 Ultra", "Galaxy S20+", "Galaxy S20 FE", "Galaxy S20",
    "Galaxy S10+", "Galaxy S10", "Galaxy S10e", "Galaxy S9+", "Galaxy S9", "Galaxy S8+", "Galaxy S8"
  ] },
  "Samsung Galaxy A": { models: [
    "Galaxy A56", "Galaxy A55 5G", "Galaxy A55", "Galaxy A54 5G", "Galaxy A54", "Galaxy A53 5G", "Galaxy A52s 5G", "Galaxy A52 5G", "Galaxy A52 4G", "Galaxy A51 5G", "Galaxy A51",
    "Galaxy A36", "Galaxy A35 5G", "Galaxy A35", "Galaxy A34 5G", "Galaxy A34", "Galaxy A33 5G", "Galaxy A32 5G", "Galaxy A32", "Galaxy A31", "Galaxy A30s", "Galaxy A30",
    "Galaxy A26", "Galaxy A25 5G", "Galaxy A25", "Galaxy A24", "Galaxy A23 5G", "Galaxy A23", "Galaxy A22 5G", "Galaxy A22 4G", "Galaxy A21s", "Galaxy A21", "Galaxy A20s", "Galaxy A20",
    "Galaxy A16", "Galaxy A15 5G", "Galaxy A15", "Galaxy A14 5G", "Galaxy A14", "Galaxy A13 5G", "Galaxy A13", "Galaxy A12 Nacho", "Galaxy A12", "Galaxy A11", "Galaxy A10s", "Galaxy A10",
    "Galaxy A05s", "Galaxy A05", "Galaxy A04s", "Galaxy A04", "Galaxy A03s", "Galaxy A03", "Galaxy A02s", "Galaxy A02", "Galaxy A01",
    "Galaxy A73 5G", "Galaxy A72", "Galaxy A71 5G", "Galaxy A71", "Galaxy A70s", "Galaxy A70", "Galaxy A42 5G", "Galaxy A41", "Galaxy A40"
  ] },
  "Samsung Galaxy Z": { models: [
    "Galaxy Z Fold 7", "Galaxy Z Fold 6", "Galaxy Z Fold 5", "Galaxy Z Fold 4", "Galaxy Z Fold 3",
    "Galaxy Z Flip 7", "Galaxy Z Flip 6", "Galaxy Z Flip 5", "Galaxy Z Flip 4", "Galaxy Z Flip 3"
  ] },
  "Samsung Galaxy Note": { models: [
    "Galaxy Note 20 Ultra", "Galaxy Note 20", "Galaxy Note 10+", "Galaxy Note 10", "Galaxy Note 9", "Galaxy Note 8"
  ] },
  "Samsung Galaxy Tablet": { models: [
    "Galaxy Tab S10 Ultra", "Galaxy Tab S10+", "Galaxy Tab S10",
    "Galaxy Tab S9 Ultra", "Galaxy Tab S9+", "Galaxy Tab S9", "Galaxy Tab S9 FE+", "Galaxy Tab S9 FE",
    "Galaxy Tab S8 Ultra", "Galaxy Tab S8+", "Galaxy Tab S8",
    "Galaxy Tab S7+", "Galaxy Tab S7", "Galaxy Tab S7 FE", "Galaxy Tab S7 Lite",
    "Galaxy Tab S6 Lite (2024)", "Galaxy Tab S6 Lite (2022)", "Galaxy Tab S6 Lite", "Galaxy Tab S6", "Galaxy Tab S5e", "Galaxy Tab S4", "Galaxy Tab S3",
    "Galaxy Tab Active 5", "Galaxy Tab Active 4 Pro", "Galaxy Tab Active 3", "Galaxy Tab Active 2",
    "Galaxy Tab A9+ 5G", "Galaxy Tab A9+", "Galaxy Tab A9", "Galaxy Tab A8 10.5", "Galaxy Tab A8",
    "Galaxy Tab A7 10.4", "Galaxy Tab A7", "Galaxy Tab A7 Lite", "Galaxy Tab A 10.1 (2019)", "Galaxy Tab A 8.0 (2019)", "Galaxy Tab A 10.5 (2018)"
  ] },
  "Oppo Find": { models: ["Find X8 Ultra", "Find X8", "Find X7 Ultra", "Find X7", "Find X6 Pro", "Find X5 Pro"] },
  "Oppo Reno": { models: ["Reno 13 Pro", "Reno 13", "Reno 12 Pro", "Reno 12", "Reno 11 Pro", "Reno 11"] },
  "Oppo A Series": { models: ["A98", "A78", "A60", "A58", "A38"] },
  "Google Pixel": { models: ["Pixel 10 Pro XL", "Pixel 10 Pro", "Pixel 10", "Pixel 10a", "Pixel 9 Pro XL", "Pixel 9 Pro", "Pixel 9", "Pixel 8 Pro", "Pixel 8a", "Pixel 8", "Pixel 7 Pro", "Pixel 7a", "Pixel 7", "Pixel 6 Pro", "Pixel 6a", "Pixel 6"] },
  "Motorola Edge": { models: ["Edge 50 Ultra", "Edge 50 Pro", "Edge 50 Fusion", "Edge 40 Pro", "Edge 40"] },
  "Motorola Razr": { models: ["Razr 50 Ultra", "Razr 50", "Razr 40 Ultra", "Razr 40"] },
  "Huawei P Series": { models: ["P60 Pro", "P50 Pro", "P40 Pro"] },
  "Huawei Mate": { models: ["Mate 60 Pro", "Mate 50 Pro", "Mate 40 Pro"] },
  "Dell Laptop": { models: ["XPS 13", "XPS 15", "XPS 17", "Latitude 5000", "Latitude 7000", "Inspiron 15", "Inspiron 16", "Vostro"] },
  "HP Laptop": { models: ["Spectre x360", "Envy", "Pavilion", "EliteBook", "ProBook", "Victus", "OMEN"] },
  "Lenovo Laptop": { models: ["ThinkPad X1 Carbon", "ThinkPad T Series", "Yoga 9i", "Yoga 7i", "IdeaPad 5", "IdeaPad 3", "Legion Pro", "Legion Slim"] },
  "ASUS Laptop": { models: ["Zenbook", "Vivobook", "ROG Zephyrus", "ROG Strix", "TUF Gaming", "ExpertBook"] },
  "Acer Laptop": { models: ["Swift", "Aspire", "Nitro", "Predator Triton", "Predator Helios", "Spin"] },
  "Others": { models: ["Other Android", "Other iOS Device", "Other Tablet", "Smartwatch", "Other Laptop", "Other Device"] }
};


/**
 * Group raw devices into Brands/Series/Models
 */
const prepareBrands = (): Brand[] => {
  const brandMap = new Map<string, Brand>();

  Object.entries(DEVICES_RAW).forEach(([key, value]) => {
    // Try to split key into Brand and Series (e.g., "Apple iPhone" -> "Apple", "iPhone")
    let brandName = key;
    let seriesName = "General";

    const parts = key.split(' ');
    if (parts.length > 1) {
      const knownBrands = ['Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'Oppo', 'Xiaomi', 'OnePlus', 'Huawei', 'Motorola', 'Realme', 'Vivo', 'Nokia', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer'];
      if (knownBrands.includes(parts[0])) {
        brandName = parts[0];
        seriesName = parts.slice(1).join(' ');
      } else if (key.startsWith('Used Devices — ')) {
        brandName = 'Used Devices';
        seriesName = key.replace('Used Devices — ', '');
      }
    }

    if (!brandMap.has(brandName)) {
      brandMap.set(brandName, {
        id: brandName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: brandName,
        series: []
      });
    }

    const brand = brandMap.get(brandName)!;
    brand.series.push({
      id: seriesName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: seriesName,
      models: value.models.map(m => ({
        id: m.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: m
      }))
    });
  });

  const brands = Array.from(brandMap.values());
  
  // Apply natural sorting
  const naturalSortDesc = (a: string, b: string) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
  const naturalSortAsc = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

  brands.sort((a, b) => naturalSortAsc(a.name, b.name));
  brands.forEach(brand => {
    brand.series.sort((a, b) => naturalSortAsc(a.name, b.name));
    brand.series.forEach(series => {
      // Models are usually better in DESC order (Newest/Higher numbers first)
      series.models.sort((a, b) => naturalSortDesc(a.name, b.name));
    });
  });

  return brands;
};

export const BRANDS: Brand[] = prepareBrands();

export const getBrandCatalog = () => BRANDS;
