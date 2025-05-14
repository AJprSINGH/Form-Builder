import { FormElementInstance } from "@/components/FormElements";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

// Assume this function exists and fetches published forms
async function fetchPublishedForms(): Promise<{ id: string; name: string }[]> {
    try {
        const response = await fetch("/api/published-forms");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const forms = await response.json();
        return forms.map((form: { id: number; name: string }) => ({
            id: String(form.id),
            name: form.name,
        }));
    } catch (error) {
        console.error("Error fetching published forms:", error);
        return [];
    }
}

// Add this function to fetch form fields
async function fetchFormFields(formId: string): Promise<any[]> {
    try {
        const response = await fetch(`/api/forms/${formId}/fields`); // Call the API endpoint
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fields = await response.json();
        return fields; // The API now returns the parsed fields
    } catch (error) {
        console.error(`Error fetching fields for form ${formId}:`, error);
        return [];
    }
}
async function fetchFormSubmissions(formId: string): Promise<Record<string, string>[]> {
    try {
        const response = await fetch(`/api/forms/${formId}/submissions/first`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching submissions for form ${formId}:`, error);
        return [];
    }
}

type PropertiesComponentProps = {
    elementInstance: FormElementInstance;
    updateElement: (element: FormElementInstance) => void;
};

export default function NestedFormFieldPropsPanel({
    elementInstance,
    updateElement,
}: PropertiesComponentProps) {
    const [publishedForms, setPublishedForms] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
    const [formFields, setFormFields] = useState<any[]>([]); // New state for form fields
    const [loadingFields, setLoadingFields] = useState(false); // New state for loading fields
    const [selectedFields, setSelectedFields] = useState<string[]>([]); // Tracks selected fields
    const [formSubmissionData, setFormSubmissionData] = useState<Record<string, string>[]>([]);

    useEffect(() => {
        const loadForms = async () => {
            try {
                const forms = await fetchPublishedForms();
                setPublishedForms(forms);
            } catch (error) {
                console.error("Error fetching published forms:", error);
            } finally {
                setLoading(false);
            }
        };
        loadForms();
    }, []);

    useEffect(() => {
        if (selectedFormId) {
            const loadFieldsAndSubmissions = async () => {
                setLoadingFields(true);
                try {
                    const [fields, submissions] = await Promise.all([
                        fetchFormFields(selectedFormId),
                        fetchFormSubmissions(selectedFormId)
                    ]);
                    setFormFields(fields);
                    setFormSubmissionData(submissions);
                } catch (error) {
                    console.error("Error loading fields or submissions:", error);
                    setFormFields([]);
                    setFormSubmissionData([]);
                } finally {
                    setLoadingFields(false);
                }
            };
            loadFieldsAndSubmissions();
        }
    }, [selectedFormId]);


    const handleFormSelect = (formId: string) => {
        setSelectedFormId(formId);
        const selectedFormName = publishedForms.find(form => form.id === formId)?.name || "";
        console.log("Selected form:", selectedFormName);
        const updatedElement = {
            ...elementInstance,
            extraAttributes: {
                ...elementInstance.extraAttributes,
                selectedFormId: formId,
                selectedFormName,
            },
        };
        console.log("Updating element with selected field:", updatedElement);
        updateElement(updatedElement);
    };

    const toggleFieldSelection = (fieldId: string) => {
        setSelectedFields((prev) =>
            prev.includes(fieldId)
                ? prev.filter((id) => id !== fieldId)
                : [...prev, fieldId]
        );
    };

    useEffect(() => {
        if (selectedFormId) {
            const selectedFormName = publishedForms.find(form => form.id === selectedFormId)?.name || "";

            const updatedElement = {
                ...elementInstance,
                extraAttributes: {
                    ...elementInstance.extraAttributes,
                    selectedFormId,
                    selectedFormName,
                    selectedNestedFields: formFields.filter(field => selectedFields.includes(field.id)),
                    selectedFormSubmissionData: formSubmissionData,
                },
            };
            updateElement(updatedElement);
        }
    }, [selectedFields, selectedFormId, formFields]);
    useEffect(() => {
        console.log("Form Fields:", formFields.map(f => f.id));
        console.log("Submission Data Keys:", Object.keys(formSubmissionData));
    }, [formFields, formSubmissionData]);

    return (
        <div className="flex flex-col gap-2">
            <Label className="text-sm">Nested Form Properties</Label>
            <Separator />
            <Label className="text-sm text-muted-foreground">
                Select a published form to include its fields.
            </Label>
            {loading && <div>Loading published forms...</div>}
            {!loading && (
                <Select onValueChange={handleFormSelect} value={selectedFormId || ""}>
                    <SelectTrigger className="w-full h-full">
                        <SelectValue placeholder="Select a published form" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                        {publishedForms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                                {form.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {selectedFormId && (
                <div className="mt-4">
                    <Label className="text-sm">Fields from Selected Form:</Label>
                    <div className="text-sm text-muted-foreground">
                        {loadingFields && <div>Loading fields...</div>}
                        {!loadingFields && formFields.length > 0 && (
                            <ul className="space-y-1">
                                {formFields.map((field) => {
                                    const fieldId = String(field.id);
                                    // Get the value from the first submission if available
                                    const value = formSubmissionData.length > 0
                                        ? formSubmissionData[0][field.id]
                                        : undefined;

                                    return (
                                        <li key={fieldId} className="flex flex-col gap-1 p-1 border rounded-md">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFields.includes(fieldId)}
                                                    onChange={() => toggleFieldSelection(fieldId)}
                                                    id={`field-${fieldId}`}
                                                />
                                                <label htmlFor={`field-${fieldId}`}>
                                                    <strong>{field.extraAttributes?.label || "Unnamed Field"}</strong> ({field.type})
                                                </label>
                                            </div>
                                            <div className="ml-6 text-sm text-muted-foreground">
                                                Value: <span className="text-white">{value ? value : "—"}</span>
                                            </div>
                                        </li>
                                    );
                                })}


                            </ul>
                        )}
                        {!loadingFields && formFields.length === 0 && selectedFormId && (
                            <div>No fields found for this form.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

