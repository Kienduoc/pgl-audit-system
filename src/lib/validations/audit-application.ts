import { z } from "zod";

export const companyInfoSchema = z.object({
    nameVn: z.string().min(1, "Tên tiếng Việt là bắt buộc"),
    nameEn: z.string().optional(),
    foundingYear: z.coerce.string().optional(),
    taxId: z.string().min(1, "Mã số thuế là bắt buộc"),
    address: z.string().min(1, "Địa chỉ trụ sở là bắt buộc"),
    factoryAddress: z.string().optional(), // Added for profile sync

    // Representative
    repName: z.string().min(1, "Tên người đại diện là bắt buộc"),
    repPosition: z.string().min(1, "Chức vụ là bắt buộc"),
    repPhone: z.string().min(1, "Số điện thoại là bắt buộc"),
    repEmail: z.string().email("Email không hợp lệ"),

    // Contact Person
    contactName: z.string().min(1, "Tên người liên hệ là bắt buộc"),
    contactPosition: z.string().optional(),
    contactPhone: z.string().min(1, "Số điện thoại là bắt buộc"),
    contactEmail: z.string().email("Email không hợp lệ"),

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
    name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
    model: z.string().min(1, "Kiểu loại là bắt buộc"),
    standard: z.string().min(1, "Tiêu chuẩn áp dụng là bắt buộc"),
    factoryName: z.string().min(1, "Tên nhà máy là bắt buộc"),
    factoryAddress: z.string().min(1, "Địa chỉ nhà máy là bắt buộc"),
    certificationType: z.enum(["New", "Expansion", "Re-assessment"]).default("New"),
});

export const locationSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Tên địa điểm là bắt buộc"),
    address: z.string().min(1, "Địa chỉ là bắt buộc"),
    products: z.string().optional(),
    personnelCount: z.coerce.number().min(0).default(0),
});

export const applicationSchema = z.object({
    companyInfo: companyInfoSchema,

    // Section 2: Certification Info
    products: z.array(productSchema).min(1, "Cần ít nhất một sản phẩm"),

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
