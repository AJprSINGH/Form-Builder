'use client';

import { GetFormWithSubmissions } from "@/actions/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ElementsType, FormElementInstance } from "@/components/FormElements";
import React, { ReactNode, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function FormReportPage({ params }: { params: { formId: string } }) {
  const [form, setForm] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState<{[key: string]: string}>({});
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const formData = await GetFormWithSubmissions(Number(params.formId));
      if (!formData) throw new Error("form not found");
      setForm(formData);

      const formElements = JSON.parse(formData.content) as FormElementInstance[];
      const cols: any[] = [];

      formElements.forEach((element) => {
        switch (element.type) {
          case "TextField":
          case "NumberField":
          case "TextAreaField":
          case "DateField":
          case "SelectField":
          case "RadioField":
          case "DateTimeField":
          case "TimeField":
          case "FileField":
          case "CheckboxField":
            cols.push({
              id: element.id,
              label: element.extraAttributes?.label,
              required: element.extraAttributes?.required,
              type: element.type,
            });
            break;

          case "NestedForm":
            const nestedFields = element.extraAttributes?.selectedNestedFields as FormElementInstance[];
            nestedFields?.forEach((nestedField) => {
              const nestedFieldId = `${element.id}_${nestedField.id}`;
              const nestedFieldLabel = `${element.extraAttributes?.selectedFormName || "Nested Form"} - ${nestedField.extraAttributes?.label || "Field"}`;
              cols.push({
                id: nestedFieldId,
                label: nestedFieldLabel,
                required: nestedField.extraAttributes?.required,
                type: nestedField.type,
              });
            });
            break;

          default:
            break;
        }
      });

      setColumns(cols);

      const rowsData = formData.FormSubmissions.map((submission: any) => {
        const content = JSON.parse(submission.content);
        const rowData: { [key: string]: any } = {
          submittedAt: submission.createdAt,
        };

        Object.keys(content).forEach((key) => {
          const value = content[key];
          if (value && value.type === "NestedForm" && value.values) {
            Object.entries(value.values).forEach(([nestedKey, nestedValue]) => {
              const flatKey = `${key}_${nestedKey}`;
              rowData[flatKey] = nestedValue;
            });
          } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            Object.keys(value).forEach((nestedKey) => {
              const flatKey = `${key}_${nestedKey}`;
              rowData[flatKey] = value[nestedKey];
            });
          } else {
            rowData[key] = value;
          }
        });

        return rowData;
      });

      setRows(rowsData);
      setFilteredRows(rowsData);
    };

    fetchData();
  }, [params.formId]);

  useEffect(() => {
    const filtered = rows.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key] || '').toLowerCase();
        return cellValue.includes(value.toLowerCase());
      });
    });
    setFilteredRows(filtered);
  }, [filters, rows]);

  const handleFilterChange = (columnId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value
    }));
  };

  const exportToExcel = () => {
    // Create a formatted data array with proper column headers
    const formattedData = filteredRows.map(row => {
      const formattedRow: { [key: string]: any } = {};
      columns.forEach(column => {
        formattedRow[column.label] = row[column.id];
      });
      formattedRow['Submitted At'] = format(new Date(row.submittedAt), "dd/MM/yyyy HH:mm:ss");
      return formattedRow;
    });

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${form.name}_export.xlsx`);
  };

  const exportToCSV = () => {
    // Create a formatted data array with proper column headers
    const formattedData = filteredRows.map(row => {
      const formattedRow: { [key: string]: any } = {};
      columns.forEach(column => {
        formattedRow[column.label] = row[column.id];
      });
      formattedRow['Submitted At'] = format(new Date(row.submittedAt), "dd/MM/yyyy HH:mm:ss");
      return formattedRow;
    });

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form.name}_export.csv`;
    link.click();
  };

  // Handle printing
  const handlePrint = useReactToPrint({
    documentTitle: form?.name || 'Form Report',
    onAfterPrint: () => setIsPrinting(false),
    contentRef: reportRef,
  });

  // Handle PDF download
  // Update the handleDownloadPDF function
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
  
    try {
      const reportElement = reportRef.current;
      
      // Create a temporary div for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportElement.innerHTML;
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.maxWidth = '100%';
      tempDiv.style.zIndex = '-1'; 

      // Remove search inputs from the temporary div
      const inputs = tempDiv.getElementsByTagName('input');
      while (inputs.length > 0) {
        inputs[0].parentNode?.removeChild(inputs[0]);
      }
      
      // Set all text to black
      const elements = tempDiv.getElementsByTagName('*');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        el.style.color = '#000000';
      }
      
      document.body.appendChild(tempDiv);
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      document.body.removeChild(tempDiv);
  
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
  
      const imgWidth = 277; // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${form.name}_report.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Update the RowCell component to show date in standard format
  function RowCell({ type, value }: { type: ElementsType; value: string }) {
    let node: ReactNode = value;
  
    switch (type) {
      case "DateField":
      case "DateTimeField":
      case "TimeField":
        if (!value) break;
        const date = new Date(value);
        node = <Badge variant="outline">
          {type === "TimeField" ? format(date, "HH:mm:ss") :
           type === "DateTimeField" ? format(date, "dd/MM/yyyy HH:mm:ss") :
           format(date, "dd/MM/yyyy")}
        </Badge>;
        break;
      case "CheckboxField":
        const checked = value === "true";
        node = <Checkbox checked={checked} disabled />;
        break;
    }
  
    return <TableCell>{node}</TableCell>;
  }

  if (!form) return <div>Loading...</div>;

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">{form.name}</h1>
      
      <div className="flex gap-2 mb-4">
        <Button onClick={exportToExcel} variant="outline" size="sm">
          Export XLSX
        </Button>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={handlePrint}
          disabled={isPrinting}
          size="sm"
          className="flex items-center gap-2"
        >
          <FiPrinter className="h-4 w-4" />
          {isPrinting ? 'Printing...' : 'Print Report'}
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          size="sm"
          className="flex items-center gap-2"
        >
          <FiDownload className="h-4 w-4" />
          {isDownloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </div>

      <div ref={reportRef} className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className="uppercase">
                  <div>
                    {column.label}
                    <Input
                      placeholder={`Search ${column.label}`}
                      value={filters[column.id] || ''}
                      onChange={(e) => handleFilterChange(column.id, e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-muted-foreground text-right uppercase">
                Submitted at
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <RowCell key={column.id} type={column.type} value={row[column.id]} />
                ))}
                <TableCell className="text-muted-foreground text-right">
                  {format(row.submittedAt, "dd/MM/yyyy HH:mm:ss")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default FormReportPage;