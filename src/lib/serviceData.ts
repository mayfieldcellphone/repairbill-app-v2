import { RepairService } from './types';

const SERVICES_RAW: Record<string, { n: string, p: number }[]> = {"Screen":[{n:"Screen Replacement (OEM)",p:0},{n:"Screen Replacement (Aftermarket)",p:0},{n:"LCD Repair",p:0},{n:"Touch Screen Not Responding",p:0},{n:"Screen Discoloration Fix",p:0},{n:"Dead Pixels Fix",p:0},{n:"Front Glass Only Replacement",p:0},{n:"True Tone Restoration",p:0}],"Battery":[{n:"Battery Replacement",p:0},{n:"Battery Calibration",p:0},{n:"Power Management IC Repair",p:0},{n:"Wireless Charging Coil Replace",p:0}],"Charging":[{n:"Charging Port Repair",p:0},{n:"Charging Port Replacement",p:0},{n:"USB-C Port Repair",p:0},{n:"Lightning Port Repair",p:0},{n:"Wireless Charging Repair",p:0},{n:"MagSafe Connector Repair",p:0}],"Camera":[{n:"Camera Replacement",p:0},{n:"Rear Camera Replacement",p:0},{n:"Front Camera Replacement",p:0},{n:"Camera Lens Cover Replacement",p:0},{n:"Camera Not Focusing Fix",p:0},{n:"Flash Repair",p:0},{n:"Ultra-Wide Camera Repair",p:0},{n:"Periscope Telephoto Repair",p:0}],"Audio":[{n:"Earpiece Speaker Repair",p:0},{n:"Loudspeaker Replacement",p:0},{n:"Microphone Repair",p:0},{n:"Headphone Jack Repair",p:0},{n:"Audio IC Repair",p:0}],"Body":[{n:"Back Glass Replacement",p:0},{n:"Back Housing Replacement",p:0},{n:"Frame / Chassis Repair",p:0},{n:"Volume Button Repair",p:0},{n:"Power Button Repair",p:0},{n:"Mute Switch Repair",p:0},{n:"SIM Card Tray Replacement",p:0},{n:"Home Button Replacement",p:0},{n:"Fingerprint Sensor Repair",p:0},{n:"Face ID Repair",p:0}],"Water Damage":[{n:"Water Damage Diagnostic",p:0},{n:"Water Damage Treatment",p:0},{n:"Corrosion Cleaning",p:0},{n:"Motherboard Ultrasonic Clean",p:0}],"Software & Data":[{n:"Software Restore / Update",p:0},{n:"Factory Reset & Setup",p:0},{n:"iCloud / Google Account Unlock",p:0},{n:"Network / Carrier Unlock",p:0},{n:"Virus / Malware Removal",p:0},{n:"Data Backup & Transfer",p:0},{n:"Data Recovery",p:0},{n:"Bootloop / Brick Fix",p:0},{n:"App Issues Troubleshoot",p:0},{n:"Phone Setup & Migration",p:0},{n:"WhatsApp / Chat Transfer",p:0},{n:"Photo & Video Transfer",p:0},{n:"Old Phone to New Phone Transfer",p:0},{n:"Contacts & Accounts Transfer",p:0},{n:"Cloud Backup Setup",p:0}],"Connectivity":[{n:"WiFi Repair",p:0},{n:"Bluetooth Repair",p:0},{n:"Cellular / 5G Antenna Repair",p:0},{n:"GPS Antenna Repair",p:0},{n:"NFC Repair",p:0},{n:"SIM Tray Repair",p:0}],"Motherboard":[{n:"Motherboard Diagnostic",p:0},{n:"Motherboard Repair (Microsoldering)",p:0},{n:"IC Chip Reballing",p:0},{n:"Short Circuit Repair",p:0},{n:"No Power Repair",p:0},{n:"CPU / GPU Repair",p:0}],"Accessories":[{n:"Tempered Glass Screen Protector",p:0},{n:"Privacy Screen Protector",p:0},{n:"Matte Screen Protector",p:0},{n:"Phone Case (Basic)",p:0},{n:"Phone Case (Premium)",p:0},{n:"Phone Case (Wallet / Folio)",p:0},{n:"Shockproof / Rugged Case",p:0},{n:"Clear Case",p:0},{n:"USB-C Cable (1m)",p:0},{n:"USB-C Cable (2m)",p:0},{n:"Lightning Cable (1m)",p:0},{n:"Lightning Cable (2m)",p:0},{n:"MFi Certified Lightning Cable",p:0},{n:"Charger (USB-C 20W)",p:0},{n:"Charger (USB-C 25W)",p:0},{n:"Charger (USB-C 45W)",p:0},{n:"Charger (Lightning / 5W)",p:0},{n:"MagSafe Charger",p:0},{n:"Wireless Charger Pad (10W)",p:0},{n:"Wireless Charger Pad (15W)",p:0},{n:"Power Bank (5000mAh)",p:0},{n:"Power Bank (10000mAh)",p:0},{n:"Power Bank (20000mAh)",p:0},{n:"Power Bank (Wireless)",p:0},{n:"Pop Socket / Grip",p:0},{n:"Ring Holder / Stand",p:0},{n:"Neck / Crossbody Strap",p:0},{n:"Car Phone Mount",p:0},{n:"Other Accessory",p:0}],"Used Devices":[{n:"Used iPhone",p:0},{n:"Used Samsung",p:0},{n:"Used Android",p:0},{n:"Used iPad",p:0},{n:"Used Laptop",p:0}],"Laptop":[{n:"Keyboard Replacement",p:0},{n:"Trackpad Replacement",p:0},{n:"Hinge Repair",p:0},{n:"DC Jack / Power Port Repair",p:0},{n:"RAM Upgrade",p:0},{n:"SSD Upgrade / Replacement",p:0},{n:"HDD to SSD Upgrade",p:0},{n:"Fan Cleaning / Replacement",p:0},{n:"Thermal Paste Replacement",p:0},{n:"OS Install (Windows)",p:0},{n:"OS Install (macOS)",p:0},{n:"Virus Removal & Cleanup",p:0},{n:"Laptop Screen Replacement",p:0},{n:"Laptop Battery Replacement",p:0},{n:"Webcam Repair",p:0},{n:"Motherboard Repair (Laptop)",p:0},{n:"Laptop General Service / Tune-up",p:0}],"Diagnostic":[{n:"Diagnostic Fee",p:0},{n:"Free Diagnostic (waived on repair)",p:0},{n:"Advanced Diagnostic",p:0},{n:"Quote / Estimate",p:0}]};

const categoryMapping: Record<string, 'hardware' | 'software' | 'accessory' | 'other'> = {
  "Screen": 'hardware',
  "Battery": 'hardware',
  "Charging": 'hardware',
  "Camera": 'hardware',
  "Audio": 'hardware',
  "Body": 'hardware',
  "Water Damage": 'hardware',
  "Software & Data": 'software',
  "Connectivity": 'hardware',
  "Motherboard": 'hardware',
  "Accessories": 'accessory',
  "Used Devices": 'other',
  "Laptop": 'hardware',
  "Diagnostic": 'software'
};

const DEFAULT_UNHIDDEN_NAMES = [
  "Screen Replacement (OEM)",
  "Screen Replacement (Aftermarket)",
  "Battery Replacement",
  "Charging Port Replacement",
  "Back Glass Replacement",
  "Camera Replacement"
];

export const REPAIR_SERVICES: RepairService[] = Object.entries(SERVICES_RAW).flatMap(([category, items]) => 
  items.map(item => {
    const isDefault = DEFAULT_UNHIDDEN_NAMES.some(defName => 
      defName.toLowerCase() === item.n.toLowerCase()
    );
    const isUsed = item.n.startsWith('Used ');
    return {
      id: item.n.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: item.n,
      category: categoryMapping[category] || 'other',
      basePrice: item.p || 0,
      hidden: !isDefault && !isUsed
    };
  })
);

export function getSavedServices(): RepairService[] {
  if (typeof window === 'undefined') return REPAIR_SERVICES;
  const saved = localStorage.getItem('honeybill_custom_services');
  if (!saved) {
    localStorage.setItem('honeybill_custom_services', JSON.stringify(REPAIR_SERVICES));
    return REPAIR_SERVICES;
  }
  try {
    const parsed: RepairService[] = JSON.parse(saved);
    const allowedUsed = ["Used iPhone", "Used Samsung", "Used Android", "Used iPad", "Used Laptop"];
    let filtered = parsed.filter(s => {
      if (s.name.startsWith('Used ') || s.category === 'other') {
        return allowedUsed.includes(s.name);
      }
      return true;
    });

    // Ensure all 5 allowed 'Used' services are present
    const existingNames = new Set(filtered.map(s => s.name));
    const usedServicesToAdd = REPAIR_SERVICES.filter(s => s.category === 'other' || s.name.startsWith('Used '));
    let hasAdded = false;
    usedServicesToAdd.forEach(s => {
      if (!existingNames.has(s.name)) {
        filtered.push(s);
        hasAdded = true;
      }
    });

    if (hasAdded || filtered.length !== parsed.length) {
      localStorage.setItem('honeybill_custom_services', JSON.stringify(filtered));
    }

    return filtered;
  } catch (e) {
    return REPAIR_SERVICES;
  }
}

