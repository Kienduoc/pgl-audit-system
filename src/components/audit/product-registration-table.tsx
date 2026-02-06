'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'

interface Product {
    id?: string
    product_name: string
    model_type: string
    brand_trademark: string
    applied_standard_id: string | null
    applied_standard_custom: string
    certification_type_id: string | null
    annual_production: string
}

interface ProductTableProps {
    auditId?: string
    onProductsChange?: (products: Product[]) => void
}

interface CertificationType {
    id: string
    code: string
    name_vi: string
    name_en: string
}

interface AppliedStandard {
    id: string
    code: string
    name: string
}

export function ProductRegistrationTable({ auditId, onProductsChange }: ProductTableProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [certificationTypes, setCertificationTypes] = useState<CertificationType[]>([])
    const [standards, setStandards] = useState<AppliedStandard[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    // Load reference data and existing products
    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('Loading product registration data...')

                // Load certification types
                const { data: certTypes, error: certError } = await supabase
                    .from('certification_types')
                    .select('*')
                    .order('code')

                if (certError) {
                    console.error('Error loading certification types:', certError)
                    toast.error('Không thể tải loại hình chứng nhận')
                } else {
                    console.log('Loaded certification types:', certTypes)
                    setCertificationTypes(certTypes || [])
                }

                // Load standards
                const { data: stdData, error: stdError } = await supabase
                    .from('applied_standards')
                    .select('*')
                    .eq('is_active', true)
                    .order('code')

                if (stdError) {
                    console.error('Error loading standards:', stdError)
                    toast.error('Không thể tải tiêu chuẩn')
                } else {
                    console.log('Loaded standards:', stdData)
                    setStandards(stdData || [])
                }

                // Load existing products if auditId is provided
                if (auditId) {
                    const { data: existingProducts } = await supabase
                        .from('audit_products')
                        .select('*')
                        .eq('audit_id', auditId)
                        .order('display_order')

                    if (existingProducts && existingProducts.length > 0) {
                        setProducts(existingProducts)
                    } else {
                        // Start with one empty row
                        addProduct()
                    }
                } else {
                    // Start with one empty row
                    addProduct()
                }
            } catch (error) {
                console.error('Error loading data:', error)
                toast.error('Không thể tải dữ liệu')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [auditId])

    // Notify parent component when products change
    useEffect(() => {
        if (onProductsChange) {
            onProductsChange(products)
        }
    }, [products, onProductsChange])

    const addProduct = () => {
        const newProduct: Product = {
            product_name: '',
            model_type: '',
            brand_trademark: '',
            applied_standard_id: null,
            applied_standard_custom: '',
            certification_type_id: null,
            annual_production: '',
        }
        setProducts([...products, newProduct])
    }

    const removeProduct = (index: number) => {
        if (products.length === 1) {
            toast.error('Phải có ít nhất 1 sản phẩm')
            return
        }
        const newProducts = products.filter((_, i) => i !== index)
        setProducts(newProducts)
    }

    const updateProduct = (index: number, field: keyof Product, value: any) => {
        const newProducts = [...products]
        newProducts[index] = { ...newProducts[index], [field]: value }
        setProducts(newProducts)
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">
                    Danh sách sản phẩm đăng ký chứng nhận
                </Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProduct}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sản phẩm
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">STT</TableHead>
                            <TableHead className="min-w-[200px]">
                                Tên sản phẩm <span className="text-red-500">*</span>
                            </TableHead>
                            <TableHead className="min-w-[150px]">Kiểu/Loại</TableHead>
                            <TableHead className="min-w-[150px]">Nhãn hiệu</TableHead>
                            <TableHead className="min-w-[200px]">
                                Tiêu chuẩn áp dụng
                            </TableHead>
                            <TableHead className="min-w-[150px]">
                                Sản lượng hàng năm
                            </TableHead>
                            <TableHead className="min-w-[180px]">
                                Loại hình chứng nhận
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product, index) => (
                            <TableRow key={index}>
                                <TableCell className="text-center">
                                    {index + 1}
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={product.product_name}
                                        onChange={(e) =>
                                            updateProduct(index, 'product_name', e.target.value)
                                        }
                                        placeholder="Nhập tên sản phẩm"
                                        required
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={product.model_type}
                                        onChange={(e) =>
                                            updateProduct(index, 'model_type', e.target.value)
                                        }
                                        placeholder="Type A, Type B..."
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={product.brand_trademark}
                                        onChange={(e) =>
                                            updateProduct(index, 'brand_trademark', e.target.value)
                                        }
                                        placeholder="Nhập nhãn hiệu"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={product.applied_standard_id || ''}
                                        onValueChange={(value) =>
                                            updateProduct(index, 'applied_standard_id', value || null)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn tiêu chuẩn" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={5}>
                                            {standards.length === 0 ? (
                                                <SelectItem value="loading" disabled>
                                                    Đang tải...
                                                </SelectItem>
                                            ) : (
                                                standards.map((std) => (
                                                    <SelectItem key={std.id} value={std.id}>
                                                        {std.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {product.applied_standard_id === standards.find(s => s.code === 'Other')?.id && (
                                        <Input
                                            value={product.applied_standard_custom}
                                            onChange={(e) =>
                                                updateProduct(index, 'applied_standard_custom', e.target.value)
                                            }
                                            placeholder="Nhập tiêu chuẩn khác"
                                            className="mt-2"
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={product.annual_production}
                                        onChange={(e) =>
                                            updateProduct(index, 'annual_production', e.target.value)
                                        }
                                        placeholder="VD: 1000 cái/năm"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={product.certification_type_id || ''}
                                        onValueChange={(value) =>
                                            updateProduct(index, 'certification_type_id', value || null)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn loại" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={5}>
                                            {certificationTypes.length === 0 ? (
                                                <SelectItem value="loading" disabled>
                                                    Đang tải...
                                                </SelectItem>
                                            ) : (
                                                certificationTypes.map((type) => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.name_vi}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeProduct(index)}
                                        disabled={products.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <p className="text-sm text-muted-foreground">
                <span className="text-red-500">*</span> Trường bắt buộc. Các trường khác có thể để trống nếu chưa có thông tin.
            </p>
        </div>
    )
}
