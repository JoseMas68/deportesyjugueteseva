/**
 * Thermal Printer Library
 * Soporte para impresoras térmicas de 58mm via WebUSB
 * Compatible con comandos ESC/POS
 */

// Tipos para WebUSB (navegador)
declare global {
  interface Navigator {
    usb: USB
  }

  interface USB {
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>
    getDevices(): Promise<USBDevice[]>
  }

  interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[]
  }

  interface USBDeviceFilter {
    vendorId?: number
    productId?: number
    classCode?: number
    subclassCode?: number
    protocolCode?: number
    serialNumber?: string
  }

  interface USBDevice {
    configuration: USBConfiguration | null
    open(): Promise<void>
    close(): Promise<void>
    selectConfiguration(configurationValue: number): Promise<void>
    claimInterface(interfaceNumber: number): Promise<void>
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>
  }

  interface USBConfiguration {
    interfaces: USBInterface[]
  }

  interface USBInterface {
    interfaceNumber: number
    alternates: USBAlternateInterface[]
  }

  interface USBAlternateInterface {
    interfaceClass: number
    endpoints: USBEndpoint[]
  }

  interface USBEndpoint {
    endpointNumber: number
    direction: 'in' | 'out'
  }

  interface USBOutTransferResult {
    bytesWritten: number
    status: 'ok' | 'stall' | 'babble'
  }
}

// Comandos ESC/POS
const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

const COMMANDS = {
  // Inicialización
  INIT: [ESC, 0x40],

  // Alineación
  ALIGN_LEFT: [ESC, 0x61, 0],
  ALIGN_CENTER: [ESC, 0x61, 1],
  ALIGN_RIGHT: [ESC, 0x61, 2],

  // Estilos de texto
  BOLD_ON: [ESC, 0x45, 1],
  BOLD_OFF: [ESC, 0x45, 0],
  DOUBLE_HEIGHT_ON: [GS, 0x21, 0x10],
  DOUBLE_WIDTH_ON: [GS, 0x21, 0x20],
  DOUBLE_SIZE_ON: [GS, 0x21, 0x30],
  NORMAL_SIZE: [GS, 0x21, 0x00],
  UNDERLINE_ON: [ESC, 0x2d, 1],
  UNDERLINE_OFF: [ESC, 0x2d, 0],

  // Corte de papel
  CUT_PARTIAL: [GS, 0x56, 0x01],
  CUT_FULL: [GS, 0x56, 0x00],

  // Abrir cajón
  OPEN_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xfa],

  // Salto de línea
  LINE_FEED: [LF],

  // Espaciado entre líneas
  LINE_SPACING_DEFAULT: [ESC, 0x32],
  LINE_SPACING: (n: number) => [ESC, 0x33, n],
}

export interface PrinterConfig {
  vendorId?: number
  productId?: number
  paperWidth?: number // en caracteres, 32 para 58mm
}

export interface TicketData {
  storeName: string
  storeAddress?: string
  storePhone?: string
  storeCIF?: string
  saleNumber: string
  date: string
  time: string
  cashier: string
  items: {
    name: string
    quantity: number
    unitPrice: number
    total: number
    variantInfo?: string
    discount?: number // Descuento en porcentaje
  }[]
  subtotal: number
  totalDiscount?: number
  tax?: number
  taxRate?: number
  total: number
  paymentMethod: string
  cashReceived?: number
  change?: number
  footer?: string
  // Datos de Verifactu (opcional)
  verifactu?: {
    qrContent: string    // URL para generar QR
    invoiceNumber: string
    hash: string         // Últimos 8 caracteres del hash
  }
}

class ThermalPrinter {
  private device: USBDevice | null = null
  private endpoint: USBEndpoint | null = null
  private config: PrinterConfig

  constructor(config: PrinterConfig = {}) {
    this.config = {
      paperWidth: 32, // 58mm = 32 caracteres
      ...config,
    }
  }

  // Verificar si WebUSB está disponible
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator
  }

  // Conectar con la impresora
  async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('WebUSB no está soportado en este navegador')
    }

    try {
      // Solicitar dispositivo USB
      this.device = await navigator.usb.requestDevice({
        filters: [
          // Filtros comunes para impresoras térmicas
          { classCode: 7 }, // Clase de impresora
        ],
      })

      await this.device.open()

      // Buscar la configuración y la interfaz
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1)
      }

      // Buscar interfaz de impresora
      const iface = this.device.configuration?.interfaces.find(i =>
        i.alternates.some(a => a.interfaceClass === 7)
      )

      if (!iface) {
        throw new Error('No se encontró interfaz de impresora')
      }

      await this.device.claimInterface(iface.interfaceNumber)

      // Buscar endpoint de salida
      const alternate = iface.alternates[0]
      this.endpoint = alternate.endpoints.find(e => e.direction === 'out') || null

      if (!this.endpoint) {
        throw new Error('No se encontró endpoint de salida')
      }

      return true
    } catch (error) {
      console.error('Error conectando impresora:', error)
      throw error
    }
  }

  // Desconectar
  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.close()
      this.device = null
      this.endpoint = null
    }
  }

  // Verificar si está conectada
  isConnected(): boolean {
    return this.device !== null && this.endpoint !== null
  }

  // Enviar datos crudos
  private async sendRaw(data: number[]): Promise<void> {
    if (!this.device || !this.endpoint) {
      throw new Error('Impresora no conectada')
    }

    const buffer = new Uint8Array(data)
    await this.device.transferOut(this.endpoint.endpointNumber, buffer)
  }

  // Enviar texto
  private async sendText(text: string): Promise<void> {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    await this.sendRaw([...data])
  }

  // Imprimir línea centrada
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2))
    return ' '.repeat(padding) + text
  }

  // Imprimir línea con precio alineado a la derecha
  private formatLine(left: string, right: string, width: number): string {
    const spaces = Math.max(1, width - left.length - right.length)
    return left + ' '.repeat(spaces) + right
  }

  // Línea separadora
  private separator(char: string = '-', width: number): string {
    return char.repeat(width)
  }

  // Truncar texto
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  // Imprimir ticket completo
  async printTicket(data: TicketData): Promise<void> {
    const width = this.config.paperWidth || 32

    // Inicializar impresora
    await this.sendRaw(COMMANDS.INIT)
    await this.sendRaw(COMMANDS.LINE_SPACING_DEFAULT)

    // Cabecera - Nombre de tienda
    await this.sendRaw(COMMANDS.ALIGN_CENTER)
    await this.sendRaw(COMMANDS.BOLD_ON)
    await this.sendRaw(COMMANDS.DOUBLE_SIZE_ON)
    await this.sendText(data.storeName + '\n')
    await this.sendRaw(COMMANDS.NORMAL_SIZE)
    await this.sendRaw(COMMANDS.BOLD_OFF)

    // Datos de la tienda
    if (data.storeAddress) {
      await this.sendText(data.storeAddress + '\n')
    }
    if (data.storePhone) {
      await this.sendText('Tel: ' + data.storePhone + '\n')
    }
    if (data.storeCIF) {
      await this.sendText('CIF: ' + data.storeCIF + '\n')
    }

    await this.sendText('\n')
    await this.sendRaw(COMMANDS.ALIGN_LEFT)

    // Línea separadora
    await this.sendText(this.separator('=', width) + '\n')

    // Info del ticket
    await this.sendText(this.formatLine('Ticket:', data.saleNumber, width) + '\n')
    await this.sendText(this.formatLine('Fecha:', data.date, width) + '\n')
    await this.sendText(this.formatLine('Hora:', data.time, width) + '\n')
    await this.sendText(this.formatLine('Cajero:', data.cashier, width) + '\n')

    await this.sendText(this.separator('-', width) + '\n')

    // Items
    for (const item of data.items) {
      // Nombre del producto
      const itemName = this.truncate(item.name, width - 2)
      await this.sendText(itemName + '\n')

      // Si tiene variante
      if (item.variantInfo) {
        await this.sendText('  ' + this.truncate(item.variantInfo, width - 4) + '\n')
      }

      // Cantidad x Precio = Total
      const qtyPrice = `  ${item.quantity} x ${item.unitPrice.toFixed(2)}`
      const itemTotal = item.total.toFixed(2) + ' EUR'
      await this.sendText(this.formatLine(qtyPrice, itemTotal, width) + '\n')

      // Si tiene descuento, mostrarlo
      if (item.discount && item.discount > 0) {
        await this.sendText(this.formatLine(`  Dto. ${item.discount}%`, `-${((item.quantity * item.unitPrice * item.discount) / 100).toFixed(2)} EUR`, width) + '\n')
      }
    }

    await this.sendText(this.separator('-', width) + '\n')

    // Subtotal y descuento si hay
    if (data.totalDiscount && data.totalDiscount > 0) {
      await this.sendText(this.formatLine('Subtotal:', data.subtotal.toFixed(2) + ' EUR', width) + '\n')
      await this.sendText(this.formatLine('Descuento:', '-' + data.totalDiscount.toFixed(2) + ' EUR', width) + '\n')
    }

    // Totales
    await this.sendRaw(COMMANDS.BOLD_ON)
    await this.sendText(this.formatLine('TOTAL:', data.total.toFixed(2) + ' EUR', width) + '\n')
    await this.sendRaw(COMMANDS.BOLD_OFF)

    // Método de pago
    let paymentLabel = 'Pago'
    switch (data.paymentMethod) {
      case 'CASH': paymentLabel = 'Efectivo'; break
      case 'CARD': paymentLabel = 'Tarjeta'; break
      case 'BIZUM': paymentLabel = 'Bizum'; break
      case 'MIXED': paymentLabel = 'Mixto'; break
    }
    await this.sendText(this.formatLine(paymentLabel + ':', data.total.toFixed(2) + ' EUR', width) + '\n')

    // Si es efectivo, mostrar recibido y cambio
    if (data.paymentMethod === 'CASH' && data.cashReceived !== undefined) {
      await this.sendText(this.formatLine('Recibido:', data.cashReceived.toFixed(2) + ' EUR', width) + '\n')
      if (data.change !== undefined && data.change > 0) {
        await this.sendText(this.formatLine('Cambio:', data.change.toFixed(2) + ' EUR', width) + '\n')
      }
    }

    await this.sendText('\n')

    // IVA incluido
    await this.sendRaw(COMMANDS.ALIGN_CENTER)
    await this.sendText('IVA incluido\n')

    // Verifactu - Info y QR (si está disponible)
    if (data.verifactu) {
      await this.sendText('\n')
      await this.sendText(this.separator('-', width) + '\n')
      await this.sendText('VERIFACTU\n')
      await this.sendText(`Hash: ${data.verifactu.hash}\n`)
      // Nota: El QR se imprime como texto (URL) ya que la impresión de imagen
      // requiere comandos específicos por modelo de impresora
      await this.sendText('Verificar en:\n')
      await this.sendText('agenciatributaria.gob.es\n')
    }

    // Footer
    if (data.footer) {
      await this.sendText('\n')
      await this.sendText(data.footer + '\n')
    } else {
      await this.sendText('\n')
      await this.sendText('Gracias por su compra\n')
    }

    // Fecha/hora actual
    await this.sendText('\n')

    // Espaciado final y corte
    await this.sendText('\n\n\n')
    await this.sendRaw(COMMANDS.CUT_PARTIAL)
  }

  // Abrir cajón de efectivo
  async openDrawer(): Promise<void> {
    await this.sendRaw(COMMANDS.OPEN_DRAWER)
  }

  // Imprimir ticket de prueba
  async printTest(): Promise<void> {
    const width = this.config.paperWidth || 32

    await this.sendRaw(COMMANDS.INIT)
    await this.sendRaw(COMMANDS.ALIGN_CENTER)
    await this.sendRaw(COMMANDS.BOLD_ON)
    await this.sendRaw(COMMANDS.DOUBLE_SIZE_ON)
    await this.sendText('TEST DE IMPRESION\n')
    await this.sendRaw(COMMANDS.NORMAL_SIZE)
    await this.sendRaw(COMMANDS.BOLD_OFF)
    await this.sendText('\n')
    await this.sendText(this.separator('=', width) + '\n')
    await this.sendText('Impresora conectada\n')
    await this.sendText('correctamente\n')
    await this.sendText(this.separator('=', width) + '\n')
    await this.sendText('\n')
    await this.sendText(new Date().toLocaleString('es-ES') + '\n')
    await this.sendText('\n\n\n')
    await this.sendRaw(COMMANDS.CUT_PARTIAL)
  }
}

// Singleton para mantener la conexión
let printerInstance: ThermalPrinter | null = null

export function getPrinter(config?: PrinterConfig): ThermalPrinter {
  if (!printerInstance) {
    printerInstance = new ThermalPrinter(config)
  }
  return printerInstance
}

export { ThermalPrinter, COMMANDS }
