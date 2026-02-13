"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Save, Send, Building2, User, FileText, Factory } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"


import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

import { applicationSchema, AuditApplicationFormValues } from "@/lib/validations/audit-application"
import { createApplication, updateApplication, deleteApplication } from "@/lib/actions/audit-application"
import { FileUploadItem } from "@/components/audit/file-upload-item"

interface ApplicationFormProps {
    initialData?: any
    companyProfile?: any
}

const ORG_TYPES = [
    "Doanh nghiệp Nhà nước",
    "Doanh nghiệp Liên doanh",
    "Công ty Cổ phần / TNHH",
    "Doanh nghiệp có vốn đầu tư nước ngoài",
    "Công ty Hợp danh",
    "Khác"
]

const ATTACHMENT_CHECKLIST = [
    "Hồ sơ pháp lý (Đăng ký kinh doanh, Chứng nhận đầu tư...)",
    "Mô tả sản phẩm, hình ảnh sản phẩm và linh kiện",
    "Catalogue / Hướng dẫn lắp đặt & sử dụng",
    "Chứng chỉ Hệ thống Quản lý Chất lượng (ISO 9001...)",
    "Hồ sơ kiểm soát sản xuất (theo dõi vật tư, hồ sơ thiết kế)",
    "Lưu đồ sản xuất / Nội dung sản xuất đặc thù",
    "Kết quả thử nghiệm điển hình (sản phẩm/linh kiện)",
    "Chứng nhận hợp quy cho mẫu điển hình",
    "Tài liệu kỹ thuật khác"
]

export function ApplicationForm({ initialData, companyProfile }: ApplicationFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Default values mapping
    // We must merge initialData with empty defaults to ensure all fields exist
    // otherwise we get "uncontrolled input" errors or missing sections

    // 1. Define empty defaults
    const emptyDefaults: AuditApplicationFormValues = {
        companyInfo: {
            nameVn: companyProfile?.company_name || "",
            nameEn: companyProfile?.company_name_en || "",
            foundingYear: companyProfile?.founding_year || "",
            taxId: companyProfile?.tax_id || companyProfile?.tax_code || "",
            address: companyProfile?.address || "",
            factoryAddress: companyProfile?.address_factory || "",

            repName: companyProfile?.representative_name || companyProfile?.full_name || "",
            repPosition: companyProfile?.representative_position || "",
            repPhone: companyProfile?.representative_phone || companyProfile?.phone || "",
            repEmail: companyProfile?.representative_email || companyProfile?.email || "",

            contactName: companyProfile?.contact_person_name || "",
            contactPosition: companyProfile?.contact_person_position || "",
            contactPhone: companyProfile?.contact_person_phone || "",
            contactEmail: companyProfile?.contact_person_email || "",

            orgType: [],
            mainMarket: "",
            totalPersonnel: 0,
            managementCount: 0,
            productionCount: 0,
            shifts: { shift1: 0, shift2: 0, shift3: 0 }
        },
        products: [
            {
                name: "", model: "", standard: "",
                factoryName: companyProfile?.company_name || "",
                factoryAddress: companyProfile?.address_factory || companyProfile?.address || "",
                certificationType: "New",
            }
        ],
        locations: [],
        hasOutsourcedProcess: false,
        outsourcedProcessDetails: "",
        hasOtherSystems: false,
        otherSystemsDetails: "",
        attachments: [],
        status: "draft"
    }

    // 2. Merge if initialData exists
    const defaultValues: Partial<AuditApplicationFormValues> = initialData ? {
        ...initialData.content,
        // Override status from root, not content
        status: initialData.status,
        // Merge nested objects securely
        companyInfo: {
            ...emptyDefaults.companyInfo,
            ...(initialData.content?.companyInfo || {})
        },
        // Ensure arrays are at least empty arrays, not undefined
        products: initialData.content?.products || emptyDefaults.products,
        locations: initialData.content?.locations || emptyDefaults.locations,
        attachments: initialData.content?.attachments || emptyDefaults.attachments,
    } : emptyDefaults

    const form = useForm<AuditApplicationFormValues>({
        // @ts-ignore - Resolver type mismatch between versions
        resolver: zodResolver(applicationSchema),
        defaultValues,
        mode: "onChange",
    })

    const formControl = form.control as any

    const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
        control: formControl,
        name: "products",
    })

    const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
        control: formControl,
        name: "locations",
    })

    async function onSubmit(data: AuditApplicationFormValues) {
        setIsSubmitting(true)
        try {
            if (initialData?.id) {
                const result = await updateApplication(initialData.id, data)
                if (result.error) {
                    toast.error("Cập nhật thất bại", { description: result.error as string })
                    return
                }
                toast.success("Đã cập nhật đơn", {
                    description: "Đơn đăng ký của bạn đã được cập nhật thành công.",
                })
                router.refresh()
                return
            }

            const result = await createApplication(data)

            if (result.error) {
                toast.error("Nộp đơn thất bại", { description: result.error as string })
                return
            }

            toast.success("Thành công", {
                description: data.status === "submitted" ? "Đã nộp đơn đăng ký để xem xét." : "Đã lưu nháp."
            })

            router.push("/audit-programs")
            router.refresh()
        } catch (error) {
            toast.error("Error", { description: "Something went wrong." })
        } finally {
            setIsSubmitting(false)
        }
    }

    const onError = (errors: any) => {
        console.error("Lỗi xác thực form:", errors)
        toast.error("Xác thực thất bại", {
            description: "Vui lòng kiểm tra lại các trường lỗi: " + Object.keys(errors).join(", ")
        })
    }

    const handleSaveDraft = () => {
        form.setValue("status", "draft")
        form.handleSubmit(onSubmit as any, onError)()
    }

    const handleSubmitApplication = () => {
        form.setValue("status", "submitted")
        form.handleSubmit(onSubmit as any, onError)()
    }

    return (
        <Form {...form}>
            <form className="space-y-8 pb-20">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">1. Thông Tin Chung</TabsTrigger>
                        <TabsTrigger value="certification">2. Chi Tiết Chứng Nhận</TabsTrigger>
                        <TabsTrigger value="attachments">3. Tài Liệu & Nộp Đơn</TabsTrigger>
                    </TabsList>

                    {/* --- TAB 1: GENERAL INFORMATION --- */}
                    <TabsContent value="general" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="md:w-5 h-5" />
                                    Thông Tin Tổ Chức
                                </CardTitle>
                                <CardDescription>Thông tin cơ bản về tổ chức của bạn.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <FormField control={formControl} name="companyInfo.nameVn" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên Tổ Chức (Tiếng Việt)</FormLabel>
                                        <FormControl><Input placeholder="Tên tiếng Việt" {...field} value={field.value ?? ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={formControl} name="companyInfo.nameEn" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên Tổ Chức (Tiếng Anh)</FormLabel>
                                        <FormControl><Input placeholder="Tên tiếng Anh" {...field} value={field.value ?? ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={formControl} name="companyInfo.foundingYear" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Năm Thành Lập</FormLabel>
                                        <FormControl><Input placeholder="YYYY" {...field} value={field.value ?? ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={formControl} name="companyInfo.taxId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mã Số Thuế / GPKD</FormLabel>
                                        <FormControl><Input placeholder="Mã số thuế" {...field} value={field.value ?? ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={formControl} name="companyInfo.address" render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Địa Chỉ Trụ Sở Chính</FormLabel>
                                        <FormControl><Textarea placeholder="Địa chỉ đầy đủ" {...field} value={field.value ?? ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={formControl} name="companyInfo.factoryAddress" render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Địa Chỉ Nhà Máy (Nơi Sản Xuất)</FormLabel>
                                        <FormControl><Textarea placeholder="Địa chỉ nhà máy" {...field} value={field.value ?? ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormItem className="col-span-2">
                                    <FormLabel>Loại Hình Tổ Chức</FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                        {ORG_TYPES.map((type) => (
                                            <FormField
                                                key={type}
                                                control={formControl}
                                                name="companyInfo.orgType"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={type}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(type)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), type])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value: string) => value !== type
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm font-normal">
                                                                {type}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                </FormItem>

                                <FormField control={formControl} name="companyInfo.mainMarket" render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Thị Trường Chính</FormLabel>
                                        <FormControl><Input placeholder="Trong nước, Xuất khẩu (Mỹ, EU...), v.v." {...field} value={field.value ?? ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Người Đại Diện Pháp Luật</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={formControl} name="companyInfo.repName" render={({ field }) => (
                                        <FormItem><FormLabel>Họ và Tên</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={formControl} name="companyInfo.repPosition" render={({ field }) => (
                                        <FormItem><FormLabel>Chức Vụ</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={formControl} name="companyInfo.repPhone" render={({ field }) => (
                                        <FormItem><FormLabel>Điện Thoại</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={formControl} name="companyInfo.repEmail" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Người Liên Hệ</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={formControl} name="companyInfo.contactName" render={({ field }) => (
                                        <FormItem><FormLabel>Họ và Tên</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={formControl} name="companyInfo.contactPosition" render={({ field }) => (
                                        <FormItem><FormLabel>Chức Vụ</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={formControl} name="companyInfo.contactPhone" render={({ field }) => (
                                        <FormItem><FormLabel>Điện Thoại</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={formControl} name="companyInfo.contactEmail" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Cơ Cấu Nhân Sự</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-3">
                                <FormField control={formControl} name="companyInfo.totalPersonnel" render={({ field }) => (
                                    <FormItem><FormLabel>Tổng Số Nhân Sự</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={formControl} name="companyInfo.managementCount" render={({ field }) => (
                                    <FormItem><FormLabel>Khối Quản Lý</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={formControl} name="companyInfo.productionCount" render={({ field }) => (
                                    <FormItem><FormLabel>Khối Sản Xuất</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />

                                <div className="col-span-3">
                                    <h4 className="text-sm font-medium mb-3">Nếu làm việc theo ca, vui lòng ghi rõ số lượng:</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField control={formControl} name="companyInfo.shifts.shift1" render={({ field }) => (
                                            <FormItem><FormLabel>Ca 1</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={formControl} name="companyInfo.shifts.shift2" render={({ field }) => (
                                            <FormItem><FormLabel>Ca 2</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={formControl} name="companyInfo.shifts.shift3" render={({ field }) => (
                                            <FormItem><FormLabel>Ca 3</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- TAB 2: CERTIFICATION INFO --- */}
                    <TabsContent value="certification" className="space-y-6 mt-6">

                        {/* PRODUCTS LIST */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">Sản Phẩm</h3>
                                    <p className="text-sm text-muted-foreground">Liệt kê tất cả sản phẩm cần chứng nhận.</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => appendProduct({
                                    name: "", model: "", standard: "",
                                    factoryName: form.getValues("companyInfo.nameVn"),
                                    factoryAddress: form.getValues("companyInfo.address"),
                                    certificationType: "New"
                                })}>
                                    <Plus className="mr-2 h-4 w-4" /> Thêm Sản Phẩm
                                </Button>
                            </div>

                            {productFields.map((field, index) => (
                                <Card key={field.id} className="relative border-dashed">
                                    <CardHeader className="py-3 bg-muted/30">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">Product {index + 1}</CardTitle>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeProduct(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
                                        <FormField control={formControl} name={`products.${index}.name`} render={({ field }) => (
                                            <FormItem><FormLabel>Tên Sản Phẩm</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={formControl} name={`products.${index}.model`} render={({ field }) => (
                                            <FormItem><FormLabel>Kiểu Loại / Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={formControl} name={`products.${index}.standard`} render={({ field }) => (
                                            <FormItem><FormLabel>Tiêu Chuẩn Áp Dụng</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={formControl} name={`products.${index}.certificationType`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loại Hình Chứng Nhận</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="New">Chứng nhận lần đầu (B)</SelectItem>
                                                        <SelectItem value="Expansion">Mở rộng phạm vi (M)</SelectItem>
                                                        <SelectItem value="Re-assessment">Tái chứng nhận (L)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={formControl} name={`products.${index}.factoryName`} render={({ field }) => (
                                            <FormItem><FormLabel>Tên Nhà Máy</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={formControl} name={`products.${index}.factoryAddress`} render={({ field }) => (
                                            <FormItem><FormLabel>Địa Chỉ Nhà Máy</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Separator />

                        {/* OUTSOURCED PROCESSES */}
                        <Card>
                            <CardHeader><CardTitle>Quá Trình Thuê Ngoài (Outsourced Processes)</CardTitle></CardHeader>
                            <CardContent>
                                <FormField control={formControl} name="hasOutsourcedProcess" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Có sử dụng nguồn lực bên ngoài không?</FormLabel>
                                            <FormDescription>Quá trình sản xuất có công đoạn thuê ngoài ảnh hưởng đến sự phù hợp không?</FormDescription>
                                        </div>
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />
                                {form.watch("hasOutsourcedProcess") && (
                                    <FormField control={formControl} name="outsourcedProcessDetails" render={({ field }) => (
                                        <FormItem className="mt-4">
                                            <FormLabel>Chi tiết quá trình thuê ngoài</FormLabel>
                                            <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}
                            </CardContent>
                        </Card>

                        {/* LOCATIONS */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">Nhiều Địa Điểm</h3>
                                    <p className="text-sm text-muted-foreground">Nếu bạn có nhiều địa điểm sản xuất.</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => appendLocation({
                                    name: "", address: "", products: "", personnelCount: 0
                                })}>
                                    <Plus className="mr-2 h-4 w-4" /> Thêm Địa Điểm
                                </Button>
                            </div>
                            {locationFields.map((field, index) => (
                                <Card key={field.id} className="relative border-dashed">
                                    <CardHeader className="py-3 bg-muted/30">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">Địa Điểm {index + 1}</CardTitle>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeLocation(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
                                        <FormField control={formControl} name={`locations.${index}.name`} render={({ field }) => (
                                            <FormItem><FormLabel>Tên Địa Điểm</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={formControl} name={`locations.${index}.address`} render={({ field }) => (
                                            <FormItem><FormLabel>Địa Chỉ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={formControl} name={`locations.${index}.products`} render={({ field }) => (
                                            <FormItem><FormLabel>Sản Phẩm Tại Địa Điểm</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={formControl} name={`locations.${index}.personnelCount`} render={({ field }) => (
                                            <FormItem><FormLabel>Số Lượng Nhân Sự</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                        )} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField control={formControl} name="assessmentDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày Đánh Giá Dự Kiến</FormLabel>
                                    <FormControl><Input placeholder="DD/MM/YYYY" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Card className="col-span-2 md:col-span-1">
                                <CardHeader className="pb-3"><CardTitle className="text-base">Hệ Thống Quản Lý Khác</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={formControl} name="hasOtherSystems" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <FormLabel className="font-normal">Đã áp dụng ISO 9001 / ISO 14001 / ISO 45001?</FormLabel>
                                        </FormItem>
                                    )} />
                                    {form.watch("hasOtherSystems") && (
                                        <FormField control={formControl} name="otherSystemsDetails" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Chi tiết (Tiêu chuẩn & Tổ chức chứng nhận)</FormLabel>
                                                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                                            </FormItem>
                                        )} />
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                    </TabsContent>

                    {/* --- TAB 3: ATTACHMENTS & SUBMIT --- */}
                    <TabsContent value="attachments" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Tài Liệu Đính Kèm</CardTitle>
                                <CardDescription>Vui lòng đính kèm các tài liệu sau:</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={formControl}
                                    name="attachments"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="grid gap-4">
                                                {ATTACHMENT_CHECKLIST.map((item) => {
                                                    // Find existing attachments for this type (now array)
                                                    const existingAttachments = field.value?.filter((a: any) => a.type === item) || [];

                                                    return (
                                                        <FileUploadItem
                                                            key={item}
                                                            label={item}
                                                            value={existingAttachments}
                                                            onChange={(updatedTypeAttachments) => {
                                                                const currentAttachments = field.value || [];
                                                                // Remove ALL old attachments of this specific type
                                                                const otherAttachments = currentAttachments.filter((a: any) => a.type !== item);

                                                                // Combine others with the new list for this type
                                                                const finalAttachments = [
                                                                    ...otherAttachments,
                                                                    ...updatedTypeAttachments
                                                                ];

                                                                field.onChange(finalAttachments);
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-end gap-4">
                            {initialData?.id && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={async () => {
                                        if (confirm("Bạn có chắc chắn muốn xóa đơn này không?")) {
                                            setIsSubmitting(true)
                                            await deleteApplication(initialData.id)
                                            toast.success("Đã xóa", { description: "Đơn đăng ký đã xóa thành công" })
                                            router.push("/audit-programs")
                                        }
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Lưu Nháp
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmitApplication}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {initialData ? "Cập Nhật Đơn" : "Nộp Đơn Đăng Ký"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </form>
        </Form >
    )
}
