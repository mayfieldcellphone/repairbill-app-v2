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

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

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

  const content = element.innerHTML;
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
          body { background: white !important; -webkit-print-color-adjust: exact; margin: 0; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        <div class="p-8">
          ${content}
        </div>
        <script>
          setTimeout(() => {
            window.focus();
            window.print();
          }, 500);
        </script>
      </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000); // 3 seconds is usually enough for the print dialog to pop up
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
