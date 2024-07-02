"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/dialog.tsx"
import {Button} from "@/components/button.tsx";

interface ExternalRedirectProps {
    isOpen: boolean;
    url: string;
}

export const ExternalRedirect: React.FC<ExternalRedirectProps> = ({ isOpen, url}) => {
    return (
        <Dialog open={isOpen} onOpenChange={() => isOpen = false}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Heads Up!</DialogTitle>
                    <DialogDescription>
                        You are about to be redirected to an external website. This link is taking you outside of our site, and we can't guarantee its content. Do you wish to proceed?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => window.location.href = url }>Yes, proceed</Button>
                    <DialogClose asChild>
                        <Button variant="destructive">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ExternalRedirect
