import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportReportToPDF(reportElement: HTMLElement, reportData: any) {
  try {
    console.log("Starting PDF export for report:", reportData.reportId);

    // Ensure styles are applied by waiting a tick
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(reportElement, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: reportElement.scrollWidth,
      windowHeight: reportElement.scrollHeight,
      onclone: (doc) => {
        // Find and remove all existing style and link tags to prevent parsing errors
        const styleTags = doc.getElementsByTagName('style');
        const linkTags = doc.getElementsByTagName('link');

        Array.from(styleTags).forEach(tag => tag.remove());
        Array.from(linkTags).forEach(tag => {
          if (tag.rel === 'stylesheet') tag.remove();
        });

        // Inject a clean, hex-only stylesheet
        const cleanStyle = doc.createElement('style');
        cleanStyle.innerHTML = `
          * { 
            color: #1e293b !important; 
            border-color: #e2e8f0 !important; 
            background-color: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
            background-image: none !important;
          }
          body { background-color: #ffffff !important; font-family: sans-serif !important; }
          .pdf-export-container { background-color: #ffffff !important; padding: 40px !important; }
          h1 { font-size: 28px !important; font-weight: bold !important; margin-bottom: 24px !important; color: #0f172a !important; }
          h3 { font-size: 20px !important; font-weight: bold !important; margin-top: 24px !important; margin-bottom: 12px !important; border-left: 4px solid #06b6d4 !important; padding-left: 12px !important; color: #0f172a !important; }
          p { font-size: 14px !important; line-height: 1.6 !important; color: #334155 !important; margin-bottom: 12px !important; }
          .grid { display: block !important; }
          .grid-cols-2 { display: block !important; }
          .gap-8 { margin-bottom: 24px !important; }
          .border-b { border-bottom: 1px solid #e2e8f0 !important; padding-bottom: 16px !important; }
          .border-t { border-top: 1px solid #e2e8f0 !important; padding-top: 16px !important; }
          .bg-slate-50 { background-color: #f1f5f9 !important; }
          .p-4 { padding: 16px !important; }
          .p-6 { padding: 24px !important; }
          .rounded-lg { border-radius: 8px !important; border: 1px solid #e2e8f0 !important; }
          .font-mono { font-family: monospace !important; font-size: 12px !important; }
          .text-primary { color: #0891b2 !important; }
          .text-slate-400 { color: #94a3b8 !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-900 { color: #0f172a !important; }
          .max-w-4xl { max-width: 100% !important; }
          .space-y-8 > * + * { margin-top: 32px !important; }
          .space-y-4 > * + * { margin-top: 16px !important; }
          .inline-flex { display: inline-flex !important; }
          .items-center { align-items: center !important; }
          .gap-2 { gap: 8px !important; }
          .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
          .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
          .rounded-full { border-radius: 9999px !important; }
          .bg-green-50 { background-color: #f0fdf4 !important; }
          .text-green-600 { color: #16a34a !important; }
          .border-green-100 { border-color: #dcfce7 !important; }
          .text-center { text-align: center !important; }
          .justify-center { justify-content: center !important; }
          .flex-col { flex-direction: column !important; }
          svg { display: none !important; } /* Hide icons to prevent rendering issues */
        `;
        doc.head.appendChild(cleanStyle);

        // Additional safety: Traverse elements and strip any remaining inline oklch
        const elements = doc.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          if (el.style) {
            const stylesToClean = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke', 'outlineColor'];
            stylesToClean.forEach(prop => {
              const inlineVal = el.style.getPropertyValue(prop);
              if (inlineVal && inlineVal.includes('oklch')) {
                el.style.removeProperty(prop);
              }
            });
          }
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add footer to all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `NeuraViva AI Analysis Report • Ref: ${reportData.reportId} • Page ${i} of ${totalPages}`,
        10,
        285
      );
      if (reportData.solanaVerificationHash) {
        pdf.setFontSize(6);
        pdf.text(`Solana Verification: ${reportData.solanaVerificationHash}`, 10, 290);
      }
    }

    pdf.save(`${reportData.reportId}-analysis-report.pdf`);
    return true;
  } catch (error) {
    console.error('CRITICAL: PDF export failed:', error);
    return false;
  }
}