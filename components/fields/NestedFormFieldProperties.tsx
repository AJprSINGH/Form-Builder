import { FormElementInstance } from "@/components/FormElements";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

// Assume this function exists and fetches published forms
async function fetchPublishedForms(): Promise<{ id: string; name: string }[]> {
    // Placeholder: Replace with actual API call to fetch published forms
    return [
        { id: "form1", name: "Published Form 1" },
        { id: "form2", name: "Published Form 2" },
        { id: "form3", name: "Published Form 3" },
    ];
}

type PropertiesComponentProps = {
    elementInstance: FormElementInstance;
    updateElement: (id: string, element: FormElementInstance) => void;
};

export default function NestedFormFieldProperties({
    elementInstance,
    updateElement,
}: PropertiesComponentProps) {
    const [publishedForms, setPublishedForms] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

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
            // Here you would typically fetch the fields of the selected form
            // and potentially store them in the elementInstance properties
            // for display in the designer and submission.
            // For now, we'll just update a placeholder property.
            updateElement(elementInstance.id, {
                ...elementInstance,
                extraAttributes: {
                    ...elementInstance.extraAttributes,
                    selectedFormId: selectedFormId,
                },
            });
        }
    }, [selectedFormId, elementInstance, updateElement]);

    const handleFormSelect = (formId: string) => {
        setSelectedFormId(formId);
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
                        {/* Placeholder: Display a message or list of fields from the selected form */}
                        Fetching and displaying fields for form: {selectedFormId}...
                    </div>
                </div>
            )}
        </div>
    );
}