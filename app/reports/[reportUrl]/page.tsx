'use client';

import { useEffect, useState, useRef } from 'react';
import ChartRenderer from '@/components/ChartRenderer';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PublishedReportPage({ params }: { params: { reportUrl: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // First fetch the report details
        const reportRes = await axios.get(`/api/reports/${params.reportUrl}`);
        setReportData(reportRes.data);

        // Then fetch the actual chart data
        const { formId, config } = reportRes.data;
        const { xKey, yKey, chartType } = JSON.parse(config);

        const dataRes = await axios.post('/api/report-data-new', {
          formId,
          xKey,
          yKey,
          chartType
        });

        setChartData(dataRes.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report');
        setLoading(false);
      }
    };

    fetchReport();
  }, [params.reportUrl]);

  // Handle printing
  const handlePrint = useReactToPrint({
    documentTitle: reportData?.name || 'Report',
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    // Fix: Use contentRef instead of content
    contentRef: reportRef,
  });


  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setIsDownloading(true);

    try {
      const reportElement = reportRef.current;
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${reportData.name || 'report'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Report Not Found</h2>
          <p>The requested report could not be found.</p>
        </div>
      </div>
    );
  }

  const { name, config } = reportData;
  const { xKey, yKey, chartType } = JSON.parse(config);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{name}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isPrinting || chartData.length === 0}
            className="flex items-center gap-2"
          >
            <FiPrinter className="h-4 w-4" />
            {isPrinting ? 'Printing...' : 'Print Report'}
          </Button>
          <Button
            variant="default"
            onClick={handleDownloadPDF}
            disabled={isDownloading || chartData.length === 0}
            className="flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="bg-white text-black rounded-lg shadow-lg p-6 print:bg-white print:text-black">
        <h2 className="text-xl font-semibold mb-4">{name}</h2>
        {chartData.length > 0 ? (
          <ChartRenderer type={chartType} data={chartData} xKey={xKey} yKey={yKey} />
        ) : (
          <p className="text-center text-gray-500 py-12">No data available for this report.</p>
        )}
      </div>
    </div>
  );
}