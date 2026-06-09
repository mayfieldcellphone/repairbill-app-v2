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

    // Create a temporary stable offscreen container to layout the invoice perfectly
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '-100000';
    container.style.pointerEvents = 'none';

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
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
      windowHeight: clonedElement.scrollHeight || 1200
    });

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

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  // Use outerHTML so we copy the container with classes and id!
  const content = element.outerHTML;
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(s => s.outerHTML)
    .join('');

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return window.open('', '_blank')?.document.write(content); // fallback
  }

  iframeDoc.open();
  iframeDoc.write(`
    <html>
      <head>
        <title>Print Invoice</title>
        ${styles}
        <style>
          @page {
            size: auto;
            margin: 15mm 15mm 15mm 15mm;
          }
          body { 
            background: #ffffff !important; 
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            margin: 0; 
            padding: 0;
            font-family: ui-sans-serif, system-ui, sans-serif;
          }
          .no-print { display: none !important; }
          
          /* Force standard color print and layout rules */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          
          /* Prevent row splitting across pages */
          tr, .grid > div, .space-y-4 > div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Keep elements full-width and remove visual noises */
          [id^="printable-invoice-"], [id^="ai-printable-"] {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%;">
          ${content}
        </div>
        <script>
          setTimeout(() => {
            window.focus();
            window.print();
          }, 600);
        </script>
      </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 5000);
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
