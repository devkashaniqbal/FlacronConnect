import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, FileText, AlertCircle } from 'lucide-react'
import { fetchDoc } from '@/lib/firestore'
import { generateInvoicePDF } from '@/hooks/useInvoices'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Spinner } from '@/components/ui'
import type { Invoice } from '@/types/payment.types'
import type { Business } from '@/types/business.types'

const statusColors: Record<string, string> = {
  paid:    'bg-green-100 text-green-700',
  sent:    'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
  draft:   'bg-gray-100 text-gray-700',
  quote:   'bg-amber-100 text-amber-700',
}

export function InvoiceViewPage() {
  const { businessId, invoiceId } = useParams<{ businessId: string; invoiceId: string }>()
  const [invoice, setInvoice]   = useState<Invoice | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    if (!businessId || !invoiceId) { setError(true); setLoading(false); return }

    Promise.all([
      fetchDoc<Invoice>(`businesses/${businessId}/invoices`, invoiceId),
      fetchDoc<Business>('businesses', businessId),
    ]).then(([inv, biz]) => {
      if (!inv) { setError(true) } else { setInvoice(inv); setBusiness(biz) }
    }).catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [businessId, invoiceId])

  function handleDownload() {
    if (!invoice) return
    generateInvoicePDF(invoice, {
      businessName: business?.name ?? 'Business',
      brandColor:   business?.brandColor ?? '#ea580c',
      logo:         business?.logo,
      address:      [business?.address, business?.city, business?.state].filter(Boolean).join(', ') || null,
      phone:        business?.phone,
      email:        business?.email,
      website:      business?.website,
    })
  }

  const brandColor = business?.brandColor ?? '#ea580c'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3 text-center px-4">
        <AlertCircle size={40} className="text-gray-400" />
        <h1 className="text-xl font-semibold text-gray-700">Invoice not found</h1>
        <p className="text-gray-500 text-sm">This link may be invalid or the invoice may have been removed.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <FileText size={16} />
            <span>Invoice #{invoice.id?.slice(-6).toUpperCase()}</span>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow hover:opacity-90 transition-opacity"
            style={{ backgroundColor: brandColor }}
          >
            <Download size={14} />
            Download PDF
          </button>
        </div>

        {/* Invoice card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Color band */}
          <div className="h-2" style={{ backgroundColor: brandColor }} />

          <div className="p-8">
            {/* Top row: business info + invoice meta */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-6 mb-8">
              <div>
                {business?.logo && (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="h-10 w-auto object-contain mb-2"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <h2 className="font-bold text-lg text-gray-900">{business?.name ?? 'Business'}</h2>
                {business?.address && <p className="text-sm text-gray-500">{business.address}{business.city ? `, ${business.city}` : ''}</p>}
                {business?.phone   && <p className="text-sm text-gray-500">{business.phone}</p>}
                {business?.email   && <p className="text-sm text-gray-500">{business.email}</p>}
              </div>

              <div className="sm:text-right">
                <p className="text-2xl font-bold text-gray-900 mb-1">INVOICE</p>
                <p className="text-sm text-gray-500">#{invoice.id?.slice(-8).toUpperCase()}</p>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Bill To + Dates */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="flex-1 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: brandColor }}>Bill To</p>
                <p className="font-semibold text-gray-900">{invoice.customerName}</p>
                {invoice.customerEmail && <p className="text-sm text-gray-500">{invoice.customerEmail}</p>}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: brandColor }}>Dates</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Issued</span>
                    <span>{formatDate(invoice.createdAt as string, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Due</span>
                    <span>{formatDate(invoice.dueDate, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full mb-6">
              <thead>
                <tr style={{ backgroundColor: brandColor }} className="text-white text-xs uppercase tracking-wider">
                  <th className="text-left py-2.5 px-3 rounded-tl-lg">Description</th>
                  <th className="text-right py-2.5 px-3">Qty</th>
                  <th className="text-right py-2.5 px-3">Rate</th>
                  <th className="text-right py-2.5 px-3 rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-3 px-3 text-gray-800">{item.description}</td>
                    <td className="py-3 px-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">{formatCurrency(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-56 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (10%)</span><span>{formatCurrency(invoice.tax)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between text-white font-bold text-sm rounded-lg px-3 py-2"
                  style={{ backgroundColor: brandColor }}
                >
                  <span>Total Due</span><span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-xs text-gray-400">Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
