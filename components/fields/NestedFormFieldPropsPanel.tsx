import { FormElementInstance } from "@/components/FormElements";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
//import prisma from "@/app/lib/prisma";
import { useEffect, useState } from "react";

// Assume this function exists and fetches published forms
async function fetchPublishedForms(): Promise<{ id: string; name: string }[]> {
    try {
        const response = await fetch("/api/published-forms"); // Call the API endpoint
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const forms = await response.json();
        // The API now returns objects with id (number) and name (string)
        return forms.map((form: { id: number; name: string }) => ({
            id: String(form.id),
            name: form.name,
        }));
        // console.log("Fetched forms from Prisma:", forms); // Add this log
        // return forms.map((form) => ({ id: String(form.id), name: form.name }));

    } catch (error) {
        console.error("Error fetching published forms:", error);
        return [];
    }
}

// Add this function to fetch form fields
async function fetchFormFields(formId: string): Promise<any[]> { // Adjust the return type based on your field structure
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

    useEffect(() => {
        const loadForms = async () => {
            try {
                const forms = await fetchPublishedForms()
                setPublishedForms(forms);
            } catch (error) {
                console.error("Error fetching published forms:", error);
            } finally {
                setLoading(false);
            }
        };
        loadForms();
    }, []);

    // New useEffect to fetch fields when selectedFormId changes
    useEffect(() => {
        if (selectedFormId) {
            const loadFields = async () => {
                setLoadingFields(true);
                try {
                    const fields = await fetchFormFields(selectedFormId);
                    setFormFields(fields);
                } catch (error) {
                    console.error("Error fetching form fields:", error);
                    setFormFields([]); // Clear fields on error
                } finally {
                    setLoadingFields(false);
                }
            };
            loadFields();
        }
    }, [selectedFormId]); // Trigger this effect when selectedFormId changes
    const handleFormSelect = (formId: string) => {
        setSelectedFormId(formId);
        const updatedElement = {
            ...elementInstance,
            extraAttributes: {
                ...elementInstance.extraAttributes,
                selectedFormId: formId,
            },
        };
        console.log("Updating element with selected field:", updatedElement);
        updateElement(updatedElement)
    };

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
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a published form" />
                    </SelectTrigger>
                    <SelectContent>
                        {publishedForms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                                {form.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {/* Placeholder to display selected form's fields or properties if needed */}
            {selectedFormId && (
                <div className="mt-4">
                    <Label className="text-sm">Fields from Selected Form:</Label>
                    <div className="text-sm text-muted-foreground">
                        {loadingFields && <div>Loading fields...</div>}
                        {!loadingFields && formFields.length > 0 && (
                            <ul>
                                {formFields.map((field, index) => (
                                    <li key={index}>{field.extraAttributes.label} ({field.type})</li> // Display field label and type
                                ))}
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