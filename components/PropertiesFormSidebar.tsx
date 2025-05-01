import React, { useState } from "react";
import useDesigner from "./hooks/useDesigner";
import { FormElementInstance, FormElements } from "./FormElements";
import { AiOutlineClose } from "react-icons/ai";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import NestedFormFieldPropsPanel from "./fields/NestedFormFieldPropsPanel";

function PropertiesFormSidebar() {
  const { selectedElement, setSelectedElement, updateElement } =
    useDesigner();

  const [element, setElement] = useState<FormElementInstance | null>(selectedElement);

  const updateElementProps = (elementInstance: FormElementInstance) => {
    updateElement(elementInstance.id, elementInstance);
    setElement(elementInstance);
  };

  if (!selectedElement) return null;

  let PropertiesForm;

  if (selectedElement.type === "NestedFormField") {
    PropertiesForm = NestedFormFieldPropsPanel;
  } else {
    PropertiesForm = FormElements[selectedElement.type].propertiesComponent;
  }

  return (
    <div className="flex flex-col p-2">
      <div className="flex justify-between items-center">
        <p className="text-sm text-foreground/70">Properties</p>
        <Button
          size={"icon"}
          variant={"ghost"}
          onClick={() => {
            setSelectedElement(null);
          }}
        >
          <AiOutlineClose />
        </Button>
      </div>
      <Separator className="mb-4" />
      <PropertiesForm
        elementInstance={element as FormElementInstance}
        updateElement={updateElementProps}
      />
    </div>
  );
}

export default PropertiesFormSidebar;
