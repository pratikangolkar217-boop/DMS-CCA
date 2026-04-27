import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Captures a DOM element as a PNG and triggers download.
 */
export async function downloadAsPNG(elementId, filename = 'BuildSmart_Report') {
  const el = document.getElementById(elementId)
  if (!el) return

  const canvas = await html2canvas(el, {
    backgroundColor: '#090e1a',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * Captures a DOM element and generates a PDF report.
 */
export async function downloadAsPDF(elementId, filename = 'BuildSmart_Report') {
  const el = document.getElementById(elementId)
  if (!el) return

  const canvas = await html2canvas(el, {
    backgroundColor: '#090e1a',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth - 20
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let position = 10
  let remainingHeight = imgHeight

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
  remainingHeight -= pageHeight

  while (remainingHeight >= 0) {
    position = position - pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    remainingHeight -= pageHeight
  }

  pdf.save(`${filename}.pdf`)
}

/**
 * Format a number as Indian currency (₹ x,xx,xxx)
 */
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
