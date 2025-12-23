import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportReportToPDF(reportElement: HTMLElement, reportData: any) {
  try {
    // Create canvas from the report element
    const canvas = await html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add footer with verification info
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `NeuraViva Research - Confidential & Proprietary`,
        10,
        pageHeight - 10
      );
      if (reportData.solanaVerificationHash) {
        pdf.text(
          `Solana Verification: ${reportData.solanaVerificationHash.substring(0, 20)}...`,
          10,
          pageHeight - 5
        );
      }
    }

    // Save the PDF
    pdf.save(`${reportData.reportId}-analysis-report.pdf`);

    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    return false;
  }
}