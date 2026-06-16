import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, InvoiceSettings } from './types';

export const getLocalDateString = (date = new Date()) => {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};

export const generatePDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    // Create a temporary stable container positioned above the viewport to layout the invoice perfectly
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '0';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '999999';

    // Clone the target element
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.width = '800px';
    clonedElement.style.maxWidth = '800px';
    clonedElement.style.padding = '32px';
    clonedElement.style.margin = '0';
    clonedElement.style.boxShadow = 'none';
    clonedElement.style.border = 'none';
    clonedElement.style.transform = 'none';
    clonedElement.style.transition = 'none';

    container.appendChild(clonedElement);
    document.body.appendChild(container);

    // Wait for the clone to layout fully
    await new Promise((resolve) => setTimeout(resolve, 200));

    let canvas;
    try {
      canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: clonedElement.scrollHeight || 1200
      });
    } catch (err) {
      console.warn("CORS or html2canvas generation error, retrying without external images...", err);
      // Strip images from clone to bypass cross-origin / tainted canvas issues
      const imgs = clonedElement.querySelectorAll('img');
      imgs.forEach(img => img.remove());
      canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: clonedElement.scrollHeight || 1200
      });
    }

    // Remove the temporary container
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    
    // Fallback if canvas is empty
    if (imgData === 'data:,') {
      throw new Error('Canvas capture failed (empty image)');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try using the Print option to Save as PDF instead.`);
  }
};

export const printInvoice = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Check if print-section already exists, remove it
  let printSection = document.getElementById('print-section');
  if (printSection) {
    printSection.remove();
  }

  // Create a new print-section div
  printSection = document.createElement('div');
  printSection.id = 'print-section';
  printSection.innerHTML = element.innerHTML;
  
  // Copy relevant classes from the parent element to keep custom styled borders/paddings if any
  printSection.className = element.className;
  
  document.body.appendChild(printSection);

  // Trigger window print
  window.print();

  // Clean up printSection shortly after print dialog closes
  setTimeout(() => {
    printSection?.remove();
  }, 1000);
};

export const shareInvoice = async (invoice: Invoice, settings: InvoiceSettings) => {
  // Encode invoice data to allow viewing without a database for this demo
  const data = btoa(JSON.stringify({ 
    invoice, 
    companyName: settings.companyName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    primaryColor: settings.primaryColor,
    currency: settings.currency,
    taxRate: settings.taxRate,
    warrantyPeriod: settings.warrantyPeriod,
    notes: settings.notes
  }));

  const shareUrl = `${window.location.origin}${window.location.pathname}?v=inv&d=${encodeURIComponent(data)}`;

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

  const shareData = {
    title: `Invoice ${invoice.invoiceNumber} from ${settings.companyName}`,
    text: `Repair invoice for ${invoice.customerName} - Total: ${formatPrice(invoice.total)}`,
    url: shareUrl
  };

  if (navigator.share && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log('Error sharing:', err);
      copyToClipboard(invoice, settings, shareUrl);
    }
  } else {
    copyToClipboard(invoice, settings, shareUrl);
  }
};

const copyToClipboard = (invoice: Invoice, settings: InvoiceSettings, url: string) => {
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

  const text = `Invoice ${invoice.invoiceNumber}
Customer: ${invoice.customerName}
Total: ${formatPrice(invoice.total)}
Status: ${invoice.status.toUpperCase()}
View Online: ${url}`;

  navigator.clipboard.writeText(text).then(() => {
    alert('Invoice link and details copied to clipboard!');
  });
};
