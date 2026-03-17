import { useMutation } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import { useAuthStore } from '@/store/authStore'
import { useBusinessStore } from '@/store/businessStore'
import {
  createDoc, updateDocById,
  subColPath, orderBy,
} from '@/lib/firestore'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import type { Invoice, InvoiceItem } from '@/types/payment.types'

// ── Branding type ─────────────────────────────────────────────────────────────
export interface InvoiceBranding {
  businessName: string
  brandColor?:  string | null   // hex e.g. '#ea580c'
  logo?:        string | null   // base64 data URL or https URL
  address?:     string | null
  phone?:       string | null
  email?:       string | null
  website?:     string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return [isNaN(r) ? 234 : r, isNaN(g) ? 88 : g, isNaN(b) ? 12 : b]
}

// ── PDF generation ─────────────────────────────────────────────────────────────

export function generateInvoicePDF(invoice: Invoice, branding: InvoiceBranding | string): void {
  // Accept legacy string (businessName only) or full branding object
  const b: InvoiceBranding = typeof branding === 'string'
    ? { businessName: branding }
    : branding

  const doc      = new jsPDF()
  const pageW    = doc.internal.pageSize.getWidth()
  const [cr, cg, cb] = hexToRgb(b.brandColor ?? '#ea580c')
  const dark     = '#111111'
  const grey     = '#666666'
  const lightBg  = '#f9fafb'

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(cr, cg, cb)
  doc.rect(0, 0, pageW, 36, 'F')

  // Logo (if provided)
  if (b.logo) {
    try {
      const fmt = b.logo.startsWith('data:image/png') ? 'PNG'
                : b.logo.startsWith('data:image/svg') ? 'SVG'
                : 'JPEG'
      doc.addImage(b.logo, fmt, 12, 4, 28, 28)
    } catch { /* skip if image fails */ }
  }

  // INVOICE label
  const logoOffset = b.logo ? 44 : 14
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', logoOffset, 22)

  // Business info top-right
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(b.businessName, pageW - 12, 10, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  let infoY = 17
  if (b.address) { doc.text(b.address, pageW - 12, infoY, { align: 'right' }); infoY += 5 }
  if (b.phone)   { doc.text(b.phone,   pageW - 12, infoY, { align: 'right' }); infoY += 5 }
  if (b.email)   { doc.text(b.email,   pageW - 12, infoY, { align: 'right' }); infoY += 5 }
  if (b.website) { doc.text(b.website, pageW - 12, infoY, { align: 'right' }) }

  // ── Invoice meta + Bill To ─────────────────────────────────────────────────
  let y = 48

  // Left: invoice details
  doc.setTextColor(dark)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`#${invoice.id?.slice(-8).toUpperCase() ?? 'NEW'}`, 14, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(grey)
  y += 7
  doc.text(`Date issued: ${formatDate(invoice.createdAt)}`, 14, y)
  y += 5
  doc.text(`Due date:    ${formatDate(invoice.dueDate)}`, 14, y)
  y += 5
  const statusColor: Record<string, [number, number, number]> = {
    paid:      [22, 163, 74],
    overdue:   [220, 38, 38],
    cancelled: [107, 114, 128],
  }
  const sc = statusColor[invoice.status] ?? [cr, cg, cb]
  doc.setTextColor(...sc)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.status.toUpperCase(), 14, y + 5)

  // Right: Bill To box
  const boxX = 118, boxY = 42, boxW = 80, boxH = 28
  doc.setFillColor(lightBg)
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, 'F')
  doc.setTextColor(cr, cg, cb)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', boxX + 4, boxY + 7)
  doc.setTextColor(dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(invoice.customerName, boxX + 4, boxY + 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(grey)
  if (invoice.customerEmail) doc.text(invoice.customerEmail, boxX + 4, boxY + 21)

  // ── Line items table ───────────────────────────────────────────────────────
  y = 82
  // Table header
  doc.setFillColor(cr, cg, cb)
  doc.rect(14, y - 6, pageW - 28, 11, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPTION', 18, y)
  doc.text('QTY',   130, y, { align: 'right' })
  doc.text('RATE',  158, y, { align: 'right' })
  doc.text('AMOUNT', pageW - 14, y, { align: 'right' })

  // Rows
  doc.setFont('helvetica', 'normal')
  y += 9
  invoice.items.forEach((item, idx) => {
    if (y > 255) { doc.addPage(); y = 20 }
    // Alternate row tint
    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(14, y - 5, pageW - 28, 9, 'F')
    }
    doc.setTextColor(dark)
    doc.setFontSize(8.5)
    // Wrap long descriptions
    const lines = doc.splitTextToSize(item.description, 100) as string[]
    doc.text(lines[0], 18, y)
    doc.setTextColor(grey)
    doc.text(String(item.quantity),                   130, y, { align: 'right' })
    doc.text(`$${fmtMoney(item.unitPrice)}`,          158, y, { align: 'right' })
    doc.setTextColor(dark)
    doc.setFont('helvetica', 'bold')
    doc.text(`$${fmtMoney(item.quantity * item.unitPrice)}`, pageW - 14, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    if (lines.length > 1) {
      y += 5
      doc.setFontSize(7.5)
      doc.setTextColor(grey)
      doc.text(lines.slice(1).join(' '), 18, y)
      doc.setFontSize(8.5)
    }
    y += 9
  })

  // ── Totals block ──────────────────────────────────────────────────────────
  y += 4
  doc.setDrawColor(230, 230, 230)
  doc.line(120, y, pageW - 14, y)
  y += 7

  const totRow = (label: string, val: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(grey)
    doc.text(label, 158, y, { align: 'right' })
    doc.setTextColor(dark)
    doc.text(val, pageW - 14, y, { align: 'right' })
    y += 7
  }

  totRow('Subtotal:', `$${fmtMoney(invoice.subtotal)}`)
  if (invoice.tax > 0) totRow('Tax (10%):', `$${fmtMoney(invoice.tax)}`)

  // Total banner
  y += 2
  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(120, y - 6, pageW - 134, 13, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL DUE', 158, y + 2, { align: 'right' })
  doc.text(`$${fmtMoney(invoice.total)}`, pageW - 14, y + 2, { align: 'right' })

  // ── Notes ────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    y += 18
    doc.setTextColor(grey)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('NOTES', 14, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    const noteLines = doc.splitTextToSize(invoice.notes, pageW - 28) as string[]
    doc.text(noteLines, 14, y)
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footY = doc.internal.pageSize.getHeight() - 12
  doc.setFillColor(248, 248, 248)
  doc.rect(0, footY - 6, pageW, 18, 'F')
  doc.setTextColor(grey)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('Thank you for your business!', pageW / 2, footY, { align: 'center' })
  if (b.website) doc.text(b.website, pageW / 2, footY + 5, { align: 'center' })
  doc.setFontSize(6.5)
  doc.setTextColor(200, 200, 200)
  doc.text('Generated by FlacronControl', pageW - 12, footY + 5, { align: 'right' })

  doc.save(`invoice-${invoice.id?.slice(-8).toUpperCase() ?? 'NEW'}.pdf`)
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
  const business    = useBusinessStore(s => s.business)
  const path = subColPath(businessId, SUB_COLLECTIONS.INVOICES)

  const { data: invoices, isLoading } = useRealtimeCollection<Invoice>(
    path,
    [orderBy('createdAt', 'desc')],
    !!businessId,
  )

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
    onSuccess: () => {},   // real-time subscription auto-updates
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Invoice['status'] }) =>
      updateDocById(path, id, { status }),
    onSuccess: () => {},   // real-time subscription auto-updates
  })

  const downloadPDF = (invoice: Invoice) => {
    generateInvoicePDF(invoice, {
      businessName: business?.name ?? businessName,
      brandColor:   business?.brandColor ?? '#ea580c',
      logo:         business?.logo,
      address:      [business?.address, business?.city, business?.state].filter(Boolean).join(', ') || null,
      phone:        business?.phone,
      email:        business?.email,
      website:      business?.website,
    })
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
