import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import { useAuthStore } from '@/store/authStore'
import {
  fetchCollection, createDoc, updateDocById,
  subColPath, orderBy,
} from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import type { Invoice, InvoiceItem } from '@/types/payment.types'

// PDF generation
export function generateInvoicePDF(invoice: Invoice, businessName: string): void {
  const doc  = new jsPDF()
  const org  = '#ea580c'
  const dark = '#0a0a0a'
  const grey = '#555555'

  // Header bar
  doc.setFillColor(234, 88, 12)
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(businessName, 196, 12, { align: 'right' })
  doc.text('Powered by FlacronControl', 196, 20, { align: 'right' })

  // Invoice meta
  doc.setTextColor(dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Invoice #${invoice.id?.slice(-6).toUpperCase() ?? 'NEW'}`, 14, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(grey)
  doc.text(`Date: ${formatDate(invoice.createdAt)}`, 14, 50)
  doc.text(`Due:  ${formatDate(invoice.dueDate)}`, 14, 57)
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 64)

  // Bill To
  doc.setTextColor(org)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', 130, 42)
  doc.setTextColor(dark)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.customerName, 130, 50)
  if (invoice.customerEmail) doc.text(invoice.customerEmail, 130, 57)

  // Line items header
  let y = 80
  doc.setFillColor(245, 245, 245)
  doc.rect(14, y - 6, 182, 10, 'F')
  doc.setTextColor(grey)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPTION', 16, y)
  doc.text('QTY', 130, y, { align: 'right' })
  doc.text('RATE', 155, y, { align: 'right' })
  doc.text('AMOUNT', 196, y, { align: 'right' })

  // Line items
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(dark)
  y += 10
  for (const item of invoice.items) {
    doc.setFontSize(9)
    doc.text(item.description, 16, y)
    doc.text(String(item.quantity), 130, y, { align: 'right' })
    doc.text(`$${item.unitPrice.toFixed(2)}`, 155, y, { align: 'right' })
    doc.text(`$${(item.quantity * item.unitPrice).toFixed(2)}`, 196, y, { align: 'right' })
    y += 8
    if (y > 250) { doc.addPage(); y = 20 }
  }

  // Totals
  y += 6
  doc.setDrawColor(229, 229, 229)
  doc.line(130, y, 196, y)
  y += 8

  doc.setFontSize(10)
  doc.setTextColor(grey)
  doc.text('Subtotal:', 155, y, { align: 'right' })
  doc.setTextColor(dark)
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 196, y, { align: 'right' })
  y += 7

  if (invoice.tax > 0) {
    doc.setTextColor(grey)
    doc.text('Tax:', 155, y, { align: 'right' })
    doc.setTextColor(dark)
    doc.text(`$${invoice.tax.toFixed(2)}`, 196, y, { align: 'right' })
    y += 7
  }

  // Total row
  doc.setFillColor(234, 88, 12)
  doc.rect(130, y - 5, 66, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL:', 155, y + 3, { align: 'right' })
  doc.text(`$${invoice.total.toFixed(2)}`, 196, y + 3, { align: 'right' })

  // Footer
  doc.setTextColor(grey)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Thank you for your business!', 105, 285, { align: 'center' })

  doc.save(`invoice-${invoice.id?.slice(-6) ?? 'new'}.pdf`)
}

function formatDate(d: unknown): string {
  if (!d) return ''
  if (d instanceof Date) return d.toLocaleDateString()
  if (typeof d === 'string') return new Date(d).toLocaleDateString()
  // Firestore Timestamp
  if (typeof (d as { toDate?: () => Date }).toDate === 'function') {
    return (d as { toDate: () => Date }).toDate().toLocaleDateString()
  }
  return ''
}

export function useInvoices() {
  const businessId  = useAuthStore(s => s.user?.businessId) ?? ''
  const businessName = useAuthStore(s => s.user?.displayName) ?? 'My Business'
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.INVOICES)

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', businessId],
    queryFn:  () => fetchCollection<Invoice>(path, [orderBy('createdAt', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: async (data: {
      customerName:  string
      customerEmail?: string
      items:         InvoiceItem[]
      dueDate:       string
      notes?:        string
      status?:       Invoice['status']
    }) => {
      const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
      const tax      = Math.round(subtotal * 0.1 * 100) / 100
      const total    = subtotal + tax
      return createDoc(path, {
        ...data,
        businessId,
        subtotal,
        tax,
        total,
        status: data.status ?? 'draft',
        pdfUrl: null,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', businessId] }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Invoice['status'] }) =>
      updateDocById(path, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', businessId] }),
  })

  const downloadPDF = (invoice: Invoice) => {
    generateInvoicePDF(invoice, businessName)
  }

  return {
    invoices,
    isLoading,
    createInvoice:  createMutation.mutateAsync,
    updateStatus:   updateStatusMutation.mutateAsync,
    downloadPDF,
    isCreating:     createMutation.isPending,
  }
}
