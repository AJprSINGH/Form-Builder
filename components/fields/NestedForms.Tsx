"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { ElementsType, FormElement, FormElementInstance } from "../FormElements";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import useDesigner from "../hooks/useDesigner";
import { getPublishedForms } from "@/lib/api";

const type: ElementsType = "NestedForms";

const extraAttributes = {
    label: "Nested Form",
    selectedFormId: "",
};

const propertiesSchema = z.object({
    label: z.string().min(2).max(50),
    selectedFormId: z.string(),
});

export const NestedFormField: FormElement = {
    type,
    construct: (id: string) => ({
        id,
        type,
        extraAttributes,
    }),
    designerBtnElement: {
        icon: () => <span className="text-lg">🧩</span>,
        label: "Nested Form",
    },
    designerComponent: DesignerComponent,
    formComponent: () => <div>Render nested form fields here</div>,
    propertiesComponent: PropertiesComponent,
    validate: () => true,
};

type CustomInstance = FormElementInstance & {
    extraAttributes: typeof extraAttributes;
};

function DesignerComponent({ elementInstance }: { elementInstance: FormElementInstance }) {
    const element = elementInstance as CustomInstance;
    const [fields, setFields] = useState<FormElementInstance[]>([]);
    const [forms, setForms] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        // Fetch published forms
        getPublishedForms().then(setForms);
    }, []);

    useEffect(() => {
        if (element.extraAttributes.selectedFormId) {
            // Fetch fields of selected form
            fetch(`/api/forms/${element.extraAttributes.selectedFormId}/fields`)
                .then((res) => res.json())
                .then((data) => setFields(data.fields));
        }
    }, [element.extraAttributes.selectedFormId]);

    const { label, selectedFormId } = element.extraAttributes;

    return (
        <div className="flex flex-col gap-3">
            <Label>{label}</Label>
            <Select
                value={selectedFormId}
                onValueChange={(value) => {
                    element.extraAttributes.selectedFormId = value;
                    setFields([]); // reset previous form fields
                }}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select a form" />
                </SelectTrigger>
                <SelectContent>
                    {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                            {form.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="border rounded p-2 bg-muted">
                <Label className="text-sm mb-1">Form Fields:</Label>
                <div className="flex flex-col gap-2">
                    {fields.map((field) => (
                        <div
                            key={field.id}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("application/json", JSON.stringify(field));
                            }}
                            className="p-2 border rounded bg-white shadow-sm cursor-move"
                        >
                            {field.extraAttributes?.label || field.type}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PropertiesComponent({ elementInstance }: { elementInstance: FormElementInstance }) {
    const element = elementInstance as CustomInstance;
    const { updateElement } = useDesigner();

    const [label, setLabel] = useState(element.extraAttributes.label);

    useEffect(() => {
        updateElement(element.id, {
            ...element,
            extraAttributes: { ...element.extraAttributes, label },
        });
    }, [label]);

    return (
        <div className="space-y-2">
            <Label>Label</Label>
            <input
                type="text"
                className="input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
            />
        </div>
    );
}
