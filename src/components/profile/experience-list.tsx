'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Briefcase, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Experience {
    id: string
    company: string
    position: string
    start_date: string
    end_date: string
    description: string
}

export function ExperienceList({ initialData }: { initialData: Experience[] }) {
    const [experiences, setExperiences] = useState<Experience[]>(initialData)
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [formData, setFormData] = useState<Partial<Experience>>({})
    const router = useRouter()

    const resetForm = () => {
        setFormData({})
        setIsAdding(false)
        setIsEditing(null)
    }

    const startEdit = (exp: Experience) => {
        setFormData(exp)
        setIsEditing(exp.id)
        setIsAdding(true)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const payload = {
            user_id: user.id,
            company: form.get('company') as string,
            position: form.get('position') as string,
            start_date: form.get('start_date') as string || null,
            end_date: form.get('end_date') as string || null,
            description: form.get('description') as string,
        }

        let error
        let data

        if (isEditing) {
            const res = await supabase
                .from('user_experiences')
                .update(payload)
                .eq('id', isEditing)
                .select()
                .single()
            error = res.error
            data = res.data
        } else {
            const res = await supabase
                .from('user_experiences')
                .insert(payload)
                .select()
                .single()
            error = res.error
            data = res.data
        }

        if (error) {
            toast.error('Failed to save')
            return
        }

        if (isEditing) {
            setExperiences(experiences.map(e => e.id === isEditing ? data : e))
            toast.success('Experience updated')
        } else {
            setExperiences([data, ...experiences])
            toast.success('Experience added')
        }
        resetForm()
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        const supabase = createClient()
        const { error } = await supabase.from('user_experiences').delete().eq('id', id)

        if (error) {
            toast.error('Failed to delete')
            return
        }
        setExperiences(experiences.filter(e => e.id !== id))
        toast.success('Deleted')
        router.refresh()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Work Experience</h3>
                {!isAdding && (
                    <Button size="sm" onClick={() => { setIsAdding(true); setFormData({}) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base">{isEditing ? 'Edit Experience' : 'New Experience'}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Company</Label>
                                    <Input name="company" defaultValue={formData.company} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Position</Label>
                                    <Input name="position" defaultValue={formData.position} required />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input type="date" name="start_date" defaultValue={formData.start_date} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input type="date" name="end_date" defaultValue={formData.end_date} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea name="description" defaultValue={formData.description} placeholder="Responsibilities and achievements..." />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
                                <Button type="submit">Save</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {experiences.map(exp => (
                    <Card key={exp.id} className="group hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                        <Briefcase className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{exp.position}</h4>
                                        <p className="text-sm font-medium">{exp.company}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {exp.start_date || 'N/A'} - {exp.end_date || 'Present'}
                                        </p>
                                        {exp.description && <p className="text-sm mt-2 text-muted-foreground">{exp.description}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(exp)}>
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {!experiences.length && !isAdding && (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                        No work experience records found.
                    </div>
                )}
            </div>
        </div>
    )
}
