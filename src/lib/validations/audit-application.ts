import { z } from "zod";

export const companyInfoSchema = z.object({
    nameVn: z.string().min(1, "Vietnamese name is required"),
    nameEn: z.string().optional(),
    foundingYear: z.string().optional(),
    taxId: z.string().min(1, "Tax ID is required"),
    address: z.string().min(1, "Headquarters address is required"),
    factoryAddress: z.string().optional(), // Added for profile sync

    // Representative
    repName: z.string().min(1, "Representative name is required"),
    repPosition: z.string().min(1, "Position is required"),
    repPhone: z.string().min(1, "Phone number is required"),
    repEmail: z.string().email("Invalid email address"),

    // Contact Person
    contactName: z.string().min(1, "Contact person name is required"),
    contactPosition: z.string().optional(),
    contactPhone: z.string().min(1, "Phone number is required"),
    contactEmail: z.string().email("Invalid email address"),

    // Organization Details
    orgType: z.array(z.string()).optional(), // State, Joint Venture, etc.
    mainMarket: z.string().optional(),

    // Personnel
    totalPersonnel: z.coerce.number().min(0).default(0),
    managementCount: z.coerce.number().min(0).default(0),
    productionCount: z.coerce.number().min(0).default(0),

    // Shifts (Ca 1, Ca 2, Ca 3)
    shifts: z.object({
        shift1: z.coerce.number().min(0).default(0),
        shift2: z.coerce.number().min(0).default(0),
        shift3: z.coerce.number().min(0).default(0),
    }).optional(),
});

export const productSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Product name is required"),
    model: z.string().min(1, "Model/Type is required"),
    standard: z.string().min(1, "Applied standard is required"),
    factoryName: z.string().min(1, "Factory name is required"),
    factoryAddress: z.string().min(1, "Factory location is required"),
    certificationType: z.enum(["New", "Expansion", "Re-assessment"]).default("New"),
});

export const locationSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Location name is required"),
    address: z.string().min(1, "Address is required"),
    products: z.string().optional(),
    personnelCount: z.coerce.number().min(0).default(0),
});

export const applicationSchema = z.object({
    companyInfo: companyInfoSchema,

    // Section 2: Certification Info
    products: z.array(productSchema).min(1, "At least one product is required"),

    hasOutsourcedProcess: z.boolean().default(false),
    outsourcedProcessDetails: z.string().optional(),

    locations: z.array(locationSchema).optional(),

    assessmentDate: z.string().optional(),

    hasOtherSystems: z.boolean().default(false), // ISO 9001 etc.
    otherSystemsDetails: z.string().optional(),

    // Attachments Checklist
    attachments: z.array(z.object({
        type: z.string(),
        fileUrl: z.string(),
        fileName: z.string(),
        fileSize: z.number().optional(),
        status: z.enum(["pending", "approved", "rejected", "uploaded"]).default("uploaded"),
        uploadedAt: z.string().optional(),
        attachmentType: z.enum(["file", "link"]).optional()
    })).optional(),

    status: z.enum(["draft", "submitted"]).default("draft"),
});

export type AuditApplicationFormValues = z.infer<typeof applicationSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type LocationFormValues = z.infer<typeof locationSchema>;
