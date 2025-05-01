import { MdOutlineCategory } from "react-icons/md";
import { ElementsType, FormElement, FormElementInstance } from "../FormElements";
import { useEffect, useState } from "react";
import NestedFormFieldPropsPanel from "./NestedFormFieldPropsPanel";

const type: ElementsType = "NestedForm";

interface PublishedForm {
    id: string;
    name: string;
    // Add other properties as needed
}

const extraAttributes = {
    // Placeholder for attributes related to selecting a published form
    selectedFormId: null,
};

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

interface FormField {
    extraAttributes: any;
    id: string;
    type: string; // e.g., 'text', 'checkbox', etc.
    label: string; // Display label for the field
}

// Placeholder API function for fetching fields of a specific form
// Add this function to fetch form fields
async function fetchFormFields(formId: string): Promise<any[]> { // Adjust the return type based on your field structure
    try {
        const response = await fetch(`/api/forms/${formId}/fields`); // Call the API endpoint
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fields = await response.json();
        console.log(fields);
        return fields; // The API now returns the parsed fields
    } catch (error) {
        console.error(`Error fetching fields for form ${formId}:`, error);
        return [];
    }
}

const NestedFormFieldComp = ({ elementInstance }: { elementInstance: FormElementInstance }) => {
    const extraAttributes = elementInstance.extraAttributes;
    const selectedNestedField = extraAttributes?.selectedNestedField; // Access the selected field

    if (!selectedNestedField) {
        // Render the default placeholder if no field is selected
        return (

            <div className="flex flex-col gap-2 w-full">
                <label className="text-sm">Nested Form Field</label>
                <div className="bg-gray-100 p-4 rounded-md border border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">
                        Select a published form to embed its fields.
                    </p>
                    {/* UI for selecting a form - This part is handled in the properties panel */}
                    {/* UI for displaying fields from the selected form - This part is handled in the properties panel */}
                </div>
            </div>
        );
    }

    // Render a representation of the selected nested field
    return (

        <div className="flex flex-col gap-2 w-full">
            <label className="text-sm">{selectedNestedField.label}</label> {/* Display the field label */}
            <div className="bg-gray-100 p-4 rounded-md border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">
                    Nested: {selectedNestedField.type} {/* Indicate it's a nested field and show its type */}
                </p>
            </div>
        </div>
    );
};
const NestedFormFieldBtn = () => { return (<></>) }
export const NestedFormFieldFormElement: FormElement = {
    type,
    construct: (id: string): FormElementInstance => ({
        id,
        type,
        extraAttributes,
    }),
    designerBtnElement: {
        icon: MdOutlineCategory, // Placeholder icon, you can change this
        label: "Nested Form",
    },
    designerComponent: NestedFormFieldComp,

    formComponent: ({ elementInstance }) => {
        const [selectedFormFields, setSelectedFormFields] = useState<FormField[]>([]);
        const handleFormSelect = async (formId: string) => {
            const fields = await fetchFormFields(formId);
            console.log("Fetched fields:", fields);
            const updatedElement = {
                ...elementInstance,
                extraAttributes: {
                    ...elementInstance.extraAttributes,
                    selectedFormId: formId,
                },
            };
            setSelectedFormFields(fields);
        };
        // Placeholder designer component UI
        return (

            <div className="flex flex-col gap-2 w-full">
                <label className="text-sm">Nested Form Field</label>
                <div className="bg-gray-100 p-4 rounded-md border border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">
                        Select a publishd form to embed its fields.
                    </p>
                    {/* UI for selecting a form */}
                    <PublishedFormsDropdown onFormSelect={handleFormSelect} />
                    {/* UI for displaying fields from the selected form */}
                    <div className="mt-2 flex flex-col gap-1 text-black">
                        {selectedFormFields.map((field) => (
                            // Render each field as a draggable item
                            <div key={field.id} className="border rounded p-2 text-black">{field.extraAttributes?.label || "Unnamed Field"}</div>
                        ))}
                        Fields Placeholder
                    </div>
                </div>
            </div>
        );
    },
    propertiesComponent: NestedFormFieldPropsPanel,
    validate: () => true, // Basic placeholder validation
};

//UI of dropdown
const PublishedFormsDropdown = ({ onFormSelect }: { onFormSelect: (formId: string) => void }) => {
    const [publishedForms, setPublishedForms] = useState<PublishedForm[]>([]);
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

    useEffect(() => {

        const loadPublishedForms = async () => {
            const forms = await fetchPublishedForms();
            setPublishedForms(forms);
        };

        loadPublishedForms();
    }, []);

    return (
        <select
            value={selectedFormId || ""}
            onChange={(e) => {
                setSelectedFormId(e.target.value);
                onFormSelect(e.target.value);
            }}
            className="border p-2 rounded"
        >
            <option value="">Select a form</option>
            {publishedForms.map((form) => (
                <option key={form.id} value={form.id}>{form.name}</option>
            ))}
        </select>
    );
}