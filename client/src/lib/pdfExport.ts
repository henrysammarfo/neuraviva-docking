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
        // Find all elements in the cloned document
        const elements = doc.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          // Forced override for any potential oklch usage
          // We target common color properties
          const style = doc.defaultView?.getComputedStyle(el);
          if (style) {
            if (style.color.includes('oklch')) el.style.color = '#1e293b';
            if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = '#ffffff';
            if (style.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
            if (style.fill.includes('oklch')) el.style.fill = '#1e293b';
            if (style.stroke.includes('oklch')) el.style.stroke = '#1e293b';
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
    const pageHeight = 297; // A4 height in mm (standard A4 is 297)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add content to PDF, creating new pages if necessary
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
        290
      );
      if (reportData.solanaVerificationHash) {
        pdf.setFontSize(6);
        pdf.text(`Solana Verification: ${reportData.solanaVerificationHash}`, 10, 294);
      }
    }

    pdf.save(`${reportData.reportId}-analysis-report.pdf`);
    console.log("PDF export completed successfully");
    return true;
  } catch (error) {
    console.error('CRITICAL: PDF export failed:', error);
    return false;
  }
}