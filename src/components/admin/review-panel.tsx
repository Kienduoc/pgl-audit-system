"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { adminReviewApplication } from "@/lib/actions/admin-review"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface ReviewPanelProps {
    application: any
}

export function ReviewPanel({ application }: ReviewPanelProps) {
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleDecision = async (decision: 'approved' | 'rejected' | 'info_needed') => {
        setIsSubmitting(true)
        try {
            const result = await adminReviewApplication(application.id, decision, notes)
            if (result.success) {
                toast.success("Success", {
                    description: `Application marked as ${decision}`,
                })
            } else {
                toast.error("Error", {
                    description: result.error,
                })
            }
        } catch (error) {
            toast.error("Error", {
                description: "Something went wrong",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="h-full border-l-4 border-l-primary/20">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Review Actions
                    <Badge variant={application.status === 'submitted' ? 'default' : 'secondary'}>{application.status}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="notes">Review Notes</Label>
                    <Textarea
                        id="notes"
                        placeholder="Add internal notes or feedback for the client..."
                        className="min-h-[150px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
                <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleDecision('approved')}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Approve & Create Project
                </Button>
                <Button
                    variant="secondary"
                    className="w-full bg-orange-100 text-orange-800 hover:bg-orange-200"
                    onClick={() => handleDecision('info_needed')}
                    disabled={isSubmitting}
                >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Request More Info
                </Button>
                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDecision('rejected')}
                    disabled={isSubmitting}
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Application
                </Button>
            </CardFooter>
        </Card>
    )
}
