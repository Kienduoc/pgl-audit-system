'use client'

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { searchClients } from '@/lib/actions/audit-applications'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface ClientSelectorProps {
    onSelect: (client: any) => void
    onNewClient: (clientData: any) => void
}

export function ClientSelector({ onSelect, onNewClient }: ClientSelectorProps) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const [clients, setClients] = useState<any[]>([])
    const [isCreatingNew, setIsCreatingNew] = useState(false)

    // New Client Form State
    const [newClientData, setNewClientData] = useState({
        english_name: '',
        tax_code: '',
        office_address: ''
    })

    useEffect(() => {
        if (open) {
            handleSearch('')
        }
    }, [open])

    const handleSearch = async (query: string) => {
        const { data } = await searchClients(query)
        if (data) setClients(data)
    }

    const handleCreateNew = () => {
        // Validate
        if (!newClientData.english_name || !newClientData.tax_code) return

        onNewClient(newClientData)
    }

    if (isCreatingNew) {
        return (
            <div className="border rounded-lg bg-background shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b bg-muted/30">
                    <div>
                        <h3 className="font-semibold text-base">Đăng Ký Khách Hàng Mới</h3>
                        <p className="text-xs text-muted-foreground">Nhập thông tin cơ bản để tạo nhanh hồ sơ.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)} className="h-8 w-8 p-0 rounded-full">
                        <span className="sr-only">Đóng</span>
                        <Plus className="h-4 w-4 rotate-45" />
                    </Button>
                </div>

                <div className="p-6 grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="english_name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Tên Công Ty (Tiếng Anh) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="english_name"
                            value={newClientData.english_name}
                            onChange={e => setNewClientData({ ...newClientData, english_name: e.target.value })}
                            placeholder="Ví dụ: Cong ty TNHH ABC..."
                            className="h-10"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="tax_code" className="text-sm font-medium leading-none">
                                Mã Số Thuế <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="tax_code"
                                value={newClientData.tax_code}
                                onChange={e => setNewClientData({ ...newClientData, tax_code: e.target.value })}
                                placeholder="Ví dụ: 0101234567"
                                className="h-10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="office_address" className="text-sm font-medium leading-none">
                                Địa Chỉ Văn Phòng
                            </Label>
                            <Input
                                id="office_address"
                                value={newClientData.office_address}
                                onChange={e => setNewClientData({ ...newClientData, office_address: e.target.value })}
                                placeholder="Ví dụ: Hà Nội, Việt Nam"
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsCreatingNew(false)}>Hủy</Button>
                        <Button onClick={handleCreateNew}>Xác Nhận & Tiếp Tục</Button>
                    </div>
                </div>
            </div>
        )

    }

    return (
        <div className="space-y-2">
            <Label>Chọn Khách Hàng</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {value
                            ? clients.find((c) => c.id === value)?.english_name
                            : "Chọn một khách hàng..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Tìm khách hàng theo tên hoặc MST..." onValueChange={handleSearch} className="h-12" />
                        <CommandList className="max-h-[350px]">
                            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                Không tìm thấy khách hàng.
                            </CommandEmpty>
                            <CommandGroup heading="Khách Hàng Hiện Có">
                                {clients.map((client) => (
                                    <CommandItem
                                        key={client.id}
                                        value={client.english_name}
                                        onSelect={() => {
                                            setValue(client.id)
                                            setOpen(false)
                                            onSelect(client)
                                        }}
                                        className="flex items-center justify-between py-3 px-4 cursor-pointer"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium truncate">{client.english_name}</span>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>Tax: {client.tax_code}</span>
                                                {client.vietnamese_name && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[200px]">{client.vietnamese_name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {value === client.id && <Check className="h-4 w-4 text-primary" />}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <div className="p-3 border-t bg-muted/50">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-10 border-dashed border-2 hover:border-primary hover:text-primary"
                                onClick={() => {
                                    setOpen(false)
                                    setIsCreatingNew(true)
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Đăng Ký Khách Hàng Mới
                            </Button>
                        </div>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
