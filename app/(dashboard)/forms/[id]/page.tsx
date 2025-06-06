import { GetFormById, GetFormWithSubmissions } from "@/actions/form";
import FormLinkShare from "@/components/FormLinkShare";
import VisitBtn from "@/components/VisitBtn";
import React, { ReactNode } from "react";
import { StatsCard } from "../../page";
import { LuView } from "react-icons/lu";
import { FaWpforms } from "react-icons/fa";
import { HiCursorClick } from "react-icons/hi";
import { TbArrowBounce } from "react-icons/tb";
import { ElementsType, FormElementInstance } from "@/components/FormElements";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TbReportAnalytics } from "react-icons/tb"; 
async function FormDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const form = await GetFormById(Number(id));
  if (!form) throw new Error("form not found");

  const { visits, submissions } = form;
  const submissionRate = visits > 0 ? (submissions / visits) * 100 : 0;
  const bounceRate = 100 - submissionRate;

  return (
    <>
      <div className="py-10 border-b border-muted">
        <div className="flex justify-between container">
          <h1 className="text-4xl font-bold truncate">{form.name}</h1>
          <div className="flex flex-col gap-2">
            <VisitBtn shareUrl={form.shareURL} />
            <Button asChild className="bg-neutral-100 hover:neutral-400">
              <Link href={`/reports/dashboard/${form.id}`} className="flex items-center gap-2">
                <TbReportAnalytics className="text-lg" />
                Form Reports
              </Link>
            </Button>
          </div>  
        </div>
      </div>
      <div className="py-4 border-b border-muted">
        <div className="container flex gap-2 items-center justify-between">
          <FormLinkShare shareUrl={form.shareURL} />
        </div>
      </div>
      <div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 container">
        <StatsCard title="Total visits" icon={<LuView className="text-blue-600" />} helperText="All time form visits" value={visits.toLocaleString() || ""} loading={false} className="shadow-md shadow-blue-600" />
        <StatsCard title="Total submissions" icon={<FaWpforms className="text-yellow-600" />} helperText="All time form submissions" value={submissions.toLocaleString() || ""} loading={false} className="shadow-md shadow-yellow-600" />
        <StatsCard title="Submission rate" icon={<HiCursorClick className="text-green-600" />} helperText="Visits that result in form submission" value={submissionRate.toLocaleString() + "%" || ""} loading={false} className="shadow-md shadow-green-600" />
        <StatsCard title="Bounce rate" icon={<TbArrowBounce className="text-red-600" />} helperText="Visits that leaves without interacting" value={bounceRate.toLocaleString() + "%" || ""} loading={false} className="shadow-md shadow-red-600" />
      </div>
      <div className="container pt-10">
        <SubmissionsTable id={form.id} />
      </div>
    </>
  );
}

export default FormDetailPage;

type Row = { [key: string]: any } & {
  submittedAt: Date;
};

async function SubmissionsTable({ id }: { id: number }) {
  const form = await GetFormWithSubmissions(id);
  if (!form) throw new Error("form not found");

  const formElements = JSON.parse(form.content) as FormElementInstance[];
  const columns: {
    id: string;
    label: string;
    required: boolean;
    type: ElementsType;
  }[] = [];

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
        columns.push({
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
          columns.push({
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

  const rows: Row[] = [];
  form.FormSubmissions.forEach((submission) => {
    const content = JSON.parse(submission.content);

    const rowData: Row = {
      submittedAt: submission.createdAt,
    };

    // Flatten top-level fields
    Object.keys(content).forEach((key) => {
      const value = content[key];

      // Handle NestedForm specially
      if (value && value.type === "NestedForm" && value.values) {
        Object.entries(value.values).forEach(([nestedKey, nestedValue]) => {
          const flatKey = `${key}_${nestedKey}`;
          rowData[flatKey] = nestedValue;
        });
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // fallback if needed for other object types
        Object.keys(value).forEach((nestedKey) => {
          const flatKey = `${key}_${nestedKey}`;
          rowData[flatKey] = value[nestedKey];
        });
      } else {
        rowData[key] = value;
      }
    });



    rows.push(rowData);
  });

  return (
    <>
      <h1 className="text-2xl font-bold my-4">Submissions</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className="uppercase">{column.label}</TableHead>
              ))}
              <TableHead className="text-muted-foreground text-right uppercase">Submitted at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <RowCell key={column.id} type={column.type} value={row[column.id]} />
                ))}
                <TableCell className="text-muted-foreground text-right">
                  {formatDistance(row.submittedAt, new Date(), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function RowCell({ type, value }: { type: ElementsType; value: string }) {
  let node: ReactNode = value;

  switch (type) {
    case "DateField":
      if (!value) break;
      const date = new Date(value);
      node = <Badge variant="outline">{format(date, "dd/MM/yyyy")}</Badge>;
      break;
    case "CheckboxField":
      const checked = value === "true";
      node = <Checkbox checked={checked} disabled />;
      break;
  }

  return <TableCell>{node}</TableCell>;
}
