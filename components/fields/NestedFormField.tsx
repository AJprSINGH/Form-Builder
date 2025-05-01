import { MdOutlineCategory } from "react-icons/md";
import { ElementsType, FormElement, FormElementInstance } from "../FormElements";
import { useEffect, useState } from "react";
import NestedFormFieldPropsPanel from "./NestedFormFieldPropsPanel";

const type: ElementsType = "NestedForm";

interface PublishedForm {
    id: string;
    name: string;
}

const extraAttributes = {
    selectedFormId: null,
};

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

interface FormField {
    extraAttributes: any;
    id: string;
    type: string;
    label: string;
}

async function fetchFormFields(formId: string): Promise<any[]> {
    try {
        const response = await fetch(`/api/forms/${formId}/fields`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fields = await response.json();
        console.log(fields);
        return fields;
    } catch (error) {
        console.error(`Error fetching fields for form ${formId}:`, error);
        return [];
    }
}

const NestedFormFieldComp = ({ elementInstance }: { elementInstance: FormElementInstance }) => {
    const extraAttributes = elementInstance.extraAttributes;
    const selectedNestedField = extraAttributes?.selectedNestedField;

    if (!selectedNestedField) {
        return (
            <div className="flex flex-col gap-2 w-full">
                <label className="text-sm">Nested Form Field</label>
                <div className="bg-gray-100 p-4 rounded-md border border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">
                        Select a published form to embed its fields.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-sm">{selectedNestedField.label}</label>
            <div className="bg-gray-100 p-4 rounded-md border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">
                    Nested: {selectedNestedField.type}
                </p>
            </div>
        </div>
    );
};

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
};

// React component name starts with uppercase
const NestedFormFieldComponent = ({ elementInstance }: { elementInstance: FormElementInstance }) => {
    const [selectedFormFields, setSelectedFormFields] = useState<FormField[]>([]);

    const handleFormSelect = async (formId: string) => {
        const fields = await fetchFormFields(formId);
        const updatedElement = {
            ...elementInstance,
            extraAttributes: {
                ...elementInstance.extraAttributes,
                selectedFormId: formId,
            },
        };
        setSelectedFormFields(fields);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-sm">Nested Form Field</label>
            <div className="bg-gray-100 p-4 rounded-md border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">
                    Select a published form to embed its fields.
                </p>
                <PublishedFormsDropdown onFormSelect={handleFormSelect} />
                <div className="mt-2 flex flex-col gap-1 text-black">
                    {selectedFormFields.map((field) => (
                        <div key={field.id} className="border rounded p-2 text-black">
                            {field.extraAttributes?.label || "Unnamed Field"}
                        </div>
                    ))}
                    Fields Placeholder
                </div>
            </div>
        </div>
    );
};

export const NestedFormFieldFormElement: FormElement = {
    type,
    construct: (id: string): FormElementInstance => ({
        id,
        type,
        extraAttributes,
    }),
    designerBtnElement: {
        icon: MdOutlineCategory,
        label: "Nested Form",
    },
    designerComponent: NestedFormFieldComp,
    formComponent: NestedFormFieldComponent,
    propertiesComponent: NestedFormFieldPropsPanel,
    validate: () => true,
};
