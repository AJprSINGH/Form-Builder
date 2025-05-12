import { MdOutlineCategory } from "react-icons/md";
import { ElementsType, FormElement, FormElementInstance } from "../FormElements";
import { useEffect, useState } from "react";
import NestedFormFieldPropsPanel from "./NestedFormFieldPropsPanel";
import useDesigner from "../hooks/useDesigner";

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
const NestedFormFieldComponent = ({ elementInstance,
    submitValue
}: {
    elementInstance: FormElementInstance;
    submitValue?: (key: string, value: any) => void;
}) => {
    const { updateElement } = useDesigner();
    const selectedNestedFields = elementInstance.extraAttributes?.selectedNestedFields || [];
    const selectedFormName = elementInstance.extraAttributes?.selectedFormName;
    let formSubmissionData = elementInstance.extraAttributes?.selectedFormSubmissionData;
    if (!Array.isArray(formSubmissionData)) {
        formSubmissionData = formSubmissionData ? [formSubmissionData] : [];
    }
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    //console.log("Selected Nested Submissions:", formSubmissionData);

    const handleChange = (fieldId: string, value: string) => {
        const newValues = { ...fieldValues, [fieldId]: value };
        setFieldValues(newValues);


        updateElement(elementInstance.id, {
            ...elementInstance,
            extraAttributes: {
                ...elementInstance.extraAttributes,
                fieldValues: newValues,
            },
        });

        if (submitValue) {
            submitValue(elementInstance.id, newValues);
        }
    };

    if (selectedNestedFields.length === 0) {
        return (
            <div className="flex flex-col gap-2 w-full">
                <label className="text-sm">Nested Form Field</label>
                <div className="bg-gray-100 p-4 rounded-md border border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm text-black">
                        No fields selected from nested form.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 w-full text-white">
            {selectedFormName && (
                <div className="text-md font-semibold text-blue-600 mb-2">
                    Nested Form: {selectedFormName}
                </div>
            )}
            {selectedNestedFields.map((field: FormField) => {
                const value = fieldValues[field.id] || "";
                const collectedValues: string[] = formSubmissionData.map((submission: Record<string, any>) => submission[field.id]).filter((v: any) => v !== undefined && v !== null);
                const label = field.extraAttributes?.label || "Unnamed Field";
                return (
                    <div key={field.id} className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{label}</span>
                        <div key={field.id} className="relative">
                            <select
                                id={field.id}
                                value={value}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" disabled>
                                    Select {label}
                                </option>
                                {collectedValues.map((val, index) => <option key={`${field.id}-${index}`} value={val}>{val}</option>)}
                            </select>
                        </div>
                    </div>
                );

                // Fallback for non-TextField types
                return (
                    <div key={field.id} className="border rounded p-2 bg-gray-50 text-sm">
                        {label} ({field.type}) — unsupported yet.
                    </div>
                );
            })}
        </div>
    );
};


export const NestedFormFieldFormElement: FormElement = {
    type,
    construct: (id: string): FormElementInstance => ({
        id,
        type,
        extraAttributes: { selectedFormId: null, selectedNestedFields: [] },
    }),
    designerBtnElement: {
        icon: MdOutlineCategory,
        label: "Nested Form",
    },
    designerComponent: NestedFormFieldComponent,
    formComponent: NestedFormFieldComponent,
    propertiesComponent: NestedFormFieldPropsPanel,
    validate: () => true,
};