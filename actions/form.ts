"use server";

import prisma from "@/lib/prisma";
import { formSchema, formSchemaType } from "@/schemas/form";
import { currentUser } from "@clerk/nextjs";

class UserNotFoundErr extends Error { }

export async function GetFormStats() {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  const stats = await prisma.form.aggregate({
    where: {
      userId: user.id,
    },
    _sum: {
      visits: true,
      submissions: true,
    },
  });

  const visits = stats._sum.visits || 0;
  const submissions = stats._sum.submissions || 0;

  let submissionRate = 0;

  if (visits > 0) {
    submissionRate = (submissions / visits) * 100;
  }

  const bounceRate = 100 - submissionRate;

  return {
    visits,
    submissions,
    submissionRate,
    bounceRate,
  };
}

export async function CreateForm(data: formSchemaType) {
  const validation = formSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("form not valid");
  }

  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  const { name, description } = data;

  const form = await prisma.form.create({
    data: {
      userId: user.id,
      name,
      description,
    },
  });

  if (!form) {
    throw new Error("something went wrong");
  }

  return form.id;
}

export async function GetForms() {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function GetFormById(id: number) {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.findUnique({
    where: {
      userId: user.id,
      id,
    },
  });
}

export async function UpdateFormContent(id: number, jsonContent: string) {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.update({
    where: {
      userId: user.id,
      id,
    },
    data: {
      content: jsonContent,
    },
  });
}

export async function PublishForm(id: number) {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.update({
    data: {
      published: true,
    },
    where: {
      userId: user.id,
      id,
    },
  });
}

export async function GetFormContentByUrl(formUrl: string) {
  return await prisma.form.update({
    select: {
      content: true,
    },
    data: {
      visits: {
        increment: 1,
      },
    },
    where: {
      shareURL: formUrl,
    },
  });
}

export async function SubmitForm(formUrl: string, content: string) {
  // Step 1: Find the form being submitted
  const parentForm = await prisma.form.findFirst({
    where: {
      shareURL: formUrl,
      published: true,
    },
  });

  if (!parentForm) throw new Error("Form not found");

  // Step 2: Create new submission
  const newSubmission = await prisma.formSubmissions.create({
    data: {
      formId: parentForm.id,
      content,
    },
  });

  // Step 3: Increment submissions counter
  await prisma.form.update({
    where: { id: parentForm.id },
    data: {
      submissions: { increment: 1 },
    },
  });

  // Step 4: Find forms that have NestedForm referring to this form
  const allForms = await prisma.form.findMany();

  for (const form of allForms) {
    let contentUpdated = false;
    const parsedContent = JSON.parse(form.content || "[]");

    for (const element of parsedContent) {
      if (
        element.type === "NestedForm" &&
        String(element.extraAttributes?.selectedFormId) === String(parentForm.id)
      ) {
        // Ensure submission data array exists
        if (!Array.isArray(element.extraAttributes.selectedFormSubmissionData)) {
          element.extraAttributes.selectedFormSubmissionData = [];
        }

        // Push the new submission content (parsed)
        element.extraAttributes.selectedFormSubmissionData.push(JSON.parse(content));
        contentUpdated = true;
        // Create a new submission for the parent form
        const parsedSubmissionContent = JSON.parse(content);
        const nestedSubmissionContent: { [key: string]: any } = {};

        // Create flattened key-value pairs for nested form fields
        element.extraAttributes.selectedNestedFields.forEach((field: any) => {
          const nestedKey = `${element.id}_${field.id}`;
          nestedSubmissionContent[nestedKey] = parsedSubmissionContent[field.id];
          console.log("Nested key: ", nestedKey);
          console.log("Nested value: ", parsedSubmissionContent[field.id]);
        });
        // Create a new submission entry for the parent form
        // await prisma.formSubmissions.create({
        //   data: {
        //     formId: form.id,
        //     content: JSON.stringify(nestedSubmissionContent)
        //   }
        // });
      }
    }

    if (contentUpdated) {
      await prisma.form.update({
        where: { id: form.id },
        data: {
          content: JSON.stringify(parsedContent),
        },
      });
      console.log("Nested form submission created"),
        console.log("Updated form content with nested submission data.");
      console.log("Updated form content: ", parsedContent);
      console.log("Updated form ID: ", form.id);



      // 4d. Increment that parent form’s submission counter
      await prisma.form.update({
        where: { id: form.id },
        data: {
          submissions: { increment: 1 },
        },
      });
    }
  }

  return newSubmission;
}

export async function GetFormWithSubmissions(id: number) {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.findUnique({
    where: {
      userId: user.id,
      id,
    },
    include: {
      FormSubmissions: true,
    },
  });
}
