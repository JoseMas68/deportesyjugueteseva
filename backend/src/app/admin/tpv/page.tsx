'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getPrinter, type TicketData } from '@/lib/thermal-printer'

interface CartItem {
  id: string
  productId: string
  variantId?: string | null
  name: string
  variantInfo?: string | null
  barcode?: string | null
  sku?: string | null
  price: number
  quantity: number
  thumbnailUrl?: string | null
  discount: number // Descuento en porcentaje (0-100)
}

interface Session {
  id: string
  adminName: string
  openingAmount: number
  openedAt: string
  salesCount: number
  totals: {
    cash: number
    card: number
    bizum: number
    expectedCash: number
  }
}

type PaymentMethod = 'CASH' | 'CARD' | 'BIZUM' | 'MIXED'

export default function TPVPage() {
  // Estado
  const [session, setSession] = useState<Session | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CartItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false)
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [cashReceived, setCashReceived] = useState('')
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingCash, setClosingCash] = useState('')
  const [closingCard, setClosingCard] = useState('')
  const [closingBizum, setClosingBizum] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSale, setLastSale] = useState<{
    saleNumber: string
    subtotal: number
    totalDiscount: number
    total: number
    change?: number
    paymentMethod: PaymentMethod
    cashReceived?: number
    items: CartItem[]
    date: string
  } | null>(null)
  const [printerConnected, setPrinterConnected] = useState(false)
  const [printerError, setPrinterError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar sesión activa
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/pos/sessions?active=true')
      const data = await res.json()
      setSession(data.session)
      if (!data.session) {
        setShowOpenSessionModal(true)
      }
    } catch {
      console.error('Error loading session')
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Focus en el input de búsqueda
  useEffect(() => {
    if (session && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [session])

  // Búsqueda de productos
  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Primero intentar como código de barras
      const barcodeRes = await fetch(`/api/pos/products?barcode=${encodeURIComponent(query)}`)
      const barcodeData = await barcodeRes.json()

      if (barcodeData.product) {
        // Añadir directamente al carrito si es código de barras
        addToCart(barcodeData.product)
        setSearchQuery('')
        setSearchResults([])
        return
      }

      // Si no, buscar por texto
      const searchRes = await fetch(`/api/pos/products?search=${encodeURIComponent(query)}`)
      const searchData = await searchRes.json()
      setSearchResults(searchData.products || [])
    } catch {
      console.error('Error searching products')
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce de búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, searchProducts])

  // Añadir al carrito
  const addToCart = (product: {
    id: string
    variantId?: string | null
    name: string
    variantInfo?: string | null
    price: number
    barcode?: string | null
    sku?: string | null
    thumbnailUrl?: string | null
  }) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.productId === product.id && item.variantId === product.variantId
      )

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex].quantity += 1
        return updated
      }

      return [...prev, {
        id: `${product.id}-${product.variantId || 'main'}-${Date.now()}`,
        productId: product.id,
        variantId: product.variantId,
        name: product.name,
        variantInfo: product.variantInfo,
        barcode: product.barcode,
        sku: product.sku,
        price: product.price,
        quantity: 1,
        thumbnailUrl: product.thumbnailUrl,
        discount: 0,
      }]
    })
  }

  // Modificar cantidad
  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  // Eliminar del carrito
  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  // Actualizar descuento de un item
  const updateDiscount = (itemId: string, discount: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, discount: Math.min(100, Math.max(0, discount)) }
      }
      return item
    }))
  }

  // Calcular total (aplicando descuentos)
  const getItemTotal = (item: CartItem) => {
    const subtotal = item.price * item.quantity
    const discountAmount = subtotal * (item.discount / 100)
    return subtotal - discountAmount
  }
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalDiscount = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.discount / 100), 0)
  const total = subtotal - totalDiscount
  const change = paymentMethod === 'CASH' ? Math.max(0, parseFloat(cashReceived || '0') - total) : 0

  // Abrir sesión
  const handleOpenSession = async () => {
    const amount = parseFloat(openingAmount)
    if (isNaN(amount) || amount < 0) {
      setError('Introduce un importe válido')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pos/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingAmount: amount }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSession(data.session)
      setShowOpenSessionModal(false)
      setOpeningAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir caja')
    } finally {
      setLoading(false)
    }
  }

  // Cerrar sesión
  const handleCloseSession = async () => {
    if (!session) return

    const cash = parseFloat(closingCash || '0')
    const card = parseFloat(closingCard || '0')
    const bizum = parseFloat(closingBizum || '0')

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/pos/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closingCash: cash, closingCard: card, closingBizum: bizum }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSession(null)
      setShowCloseSessionModal(false)
      setClosingCash('')
      setClosingCard('')
      setClosingBizum('')
      setShowOpenSessionModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar caja')
    } finally {
      setLoading(false)
    }
  }

  // Conectar impresora
  const connectPrinter = async () => {
    try {
      setPrinterError(null)
      const printer = getPrinter()

      if (!printer.isSupported()) {
        setPrinterError('WebUSB no está soportado. Usa Chrome o Edge.')
        return
      }

      await printer.connect()
      setPrinterConnected(true)

      // Test de impresión
      await printer.printTest()
    } catch (err) {
      setPrinterError(err instanceof Error ? err.message : 'Error al conectar impresora')
      setPrinterConnected(false)
    }
  }

  // Imprimir ticket
  const printTicket = async (saleData: typeof lastSale) => {
    if (!saleData) return

    try {
      const printer = getPrinter()

      if (!printer.isConnected()) {
        setPrinterError('Impresora no conectada')
        return
      }

      const ticketData: TicketData = {
        storeName: 'Deportes y Juguetes Eva',
        storeAddress: 'C/San Pascual 19, 12540 Vila-Real',
        storePhone: '694 521 238',
        storeCIF: 'DNI 52940418-F',
        saleNumber: saleData.saleNumber,
        date: new Date(saleData.date).toLocaleDateString('es-ES'),
        time: new Date(saleData.date).toLocaleTimeString('es-ES'),
        cashier: session?.adminName || 'Admin',
        items: saleData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: getItemTotal(item),
          variantInfo: item.variantInfo || undefined,
          discount: item.discount,
        })),
        subtotal: saleData.subtotal,
        totalDiscount: saleData.totalDiscount,
        total: saleData.total,
        paymentMethod: saleData.paymentMethod,
        cashReceived: saleData.cashReceived,
        change: saleData.change,
        footer: '¡Gracias por su visita!',
      }

      await printer.printTicket(ticketData)
    } catch (err) {
      setPrinterError(err instanceof Error ? err.message : 'Error al imprimir')
    }
  }

  // Abrir cajón
  const openDrawer = async () => {
    try {
      const printer = getPrinter()
      if (printer.isConnected()) {
        await printer.openDrawer()
      }
    } catch (err) {
      console.error('Error abriendo cajón:', err)
    }
  }

  // Procesar venta
  const handleSale = async () => {
    if (cart.length === 0) return

    if (paymentMethod === 'CASH') {
      const received = parseFloat(cashReceived || '0')
      if (received < total) {
        setError('El efectivo recibido es insuficiente')
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.name,
            productBarcode: item.barcode,
            productSku: item.sku,
            variantInfo: item.variantInfo,
            quantity: item.quantity,
            unitPrice: item.price,
            discount: item.discount,
          })),
          paymentMethod,
          cashReceived: paymentMethod === 'CASH' ? parseFloat(cashReceived) : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Guardar datos de la venta para imprimir
      const saleInfo = {
        saleNumber: data.sale.saleNumber,
        subtotal,
        totalDiscount,
        total: data.sale.total,
        change: data.sale.cashChange,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? parseFloat(cashReceived) : undefined,
        items: [...cart], // Copia del carrito antes de limpiarlo
        date: new Date().toISOString(),
      }
      setLastSale(saleInfo)

      // Imprimir ticket automáticamente si hay impresora
      if (printerConnected) {
        await printTicket(saleInfo)
      }

      // Abrir cajón si es efectivo
      if (paymentMethod === 'CASH' && printerConnected) {
        await openDrawer()
      }

      // Limpiar carrito y cerrar modal
      setCart([])
      setShowPaymentModal(false)
      setCashReceived('')
      setPaymentMethod('CASH')

      // Recargar sesión para actualizar totales
      loadSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar venta')
    } finally {
      setLoading(false)
    }
  }

  // Si no hay sesión activa, mostrar modal para abrir
  if (!session) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6">Abrir Caja</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fondo de caja inicial
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="w-full px-4 py-3 text-2xl font-mono border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                placeholder="0.00"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">EUR</span>
            </div>
          </div>
          <button
            onClick={handleOpenSession}
            disabled={loading}
            className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-yellow-400">TPV</h1>
          <span className="text-gray-400">|</span>
          <span className="text-sm">{session.adminName}</span>
        </div>
        <div className="flex items-center gap-6">
          {/* Estado de impresora */}
          <button
            onClick={connectPrinter}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              printerConnected
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={printerConnected ? 'Impresora conectada' : 'Conectar impresora'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {printerConnected ? 'Conectada' : 'Impresora'}
          </button>
          <div className="text-right">
            <div className="text-xs text-gray-400">Ventas hoy</div>
            <div className="font-bold">{session.salesCount}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Efectivo esperado</div>
            <div className="font-bold text-green-400">{session.totals.expectedCash.toFixed(2)} EUR</div>
          </div>
          <button
            onClick={() => setShowCloseSessionModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar Caja
          </button>
        </div>
      </header>

      {/* Error de impresora */}
      {printerError && (
        <div className="mx-4 mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{printerError}</span>
          <button onClick={() => setPrinterError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo: Búsqueda y resultados */}
        <div className="w-2/3 p-4 flex flex-col">
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escanea código de barras o busca producto..."
                className="w-full px-4 py-4 pl-12 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin w-5 h-5 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <h3 className="font-semibold text-gray-700 mb-3">Resultados</h3>
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addToCart(product)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-yellow-50 hover:border-yellow-400 transition-colors text-left"
                  >
                    {product.thumbnailUrl ? (
                      <img src={product.thumbnailUrl} alt="" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{product.name}</div>
                      {product.variantInfo && (
                        <div className="text-xs text-gray-500">{product.variantInfo}</div>
                      )}
                      <div className="text-sm font-bold text-yellow-600">{product.price.toFixed(2)} EUR</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje de última venta */}
          {lastSale && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-800 font-bold">Venta completada</div>
                  <div className="text-green-600 text-sm">{lastSale.saleNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-800">{lastSale.total.toFixed(2)} EUR</div>
                  {lastSale.change !== undefined && lastSale.change > 0 && (
                    <div className="text-green-600">Cambio: {lastSale.change.toFixed(2)} EUR</div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {/* Botón reimprimir */}
                  <button
                    onClick={() => printTicket(lastSale)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                    title="Reimprimir ticket"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                  {/* Botón cerrar */}
                  <button
                    onClick={() => setLastSale(null)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                    title="Cerrar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Área de teclas rápidas / productos frecuentes */}
          <div className="flex-1 bg-white rounded-xl shadow-lg p-6 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-lg font-medium">Escanea un código de barras</p>
              <p className="text-sm">o busca un producto por nombre</p>
            </div>
          </div>
        </div>

        {/* Panel derecho: Carrito */}
        <div className="w-1/3 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Ticket actual</h2>
            <div className="text-sm text-gray-500">{cart.length} artículo{cart.length !== 1 ? 's' : ''}</div>
          </div>

          {/* Lista de items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>Carrito vacío</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{item.name}</div>
                        {item.variantInfo && (
                          <div className="text-xs text-gray-500">{item.variantInfo}</div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{item.price.toFixed(2)} EUR x {item.quantity}</div>
                        {item.discount > 0 ? (
                          <>
                            <div className="text-xs text-red-500 line-through">{(item.price * item.quantity).toFixed(2)} EUR</div>
                            <div className="font-bold text-green-600">{getItemTotal(item).toFixed(2)} EUR</div>
                          </>
                        ) : (
                          <div className="font-bold">{(item.price * item.quantity).toFixed(2)} EUR</div>
                        )}
                      </div>
                    </div>
                    {/* Control de descuento */}
                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Descuento:</span>
                      <div className="flex items-center gap-1">
                        {[0, 5, 10, 15, 20, 25, 50].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => updateDiscount(item.id, pct)}
                            className={`px-2 py-1 text-xs rounded ${
                              item.discount === pct
                                ? 'bg-yellow-400 text-black font-bold'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || ''}
                          onChange={(e) => updateDiscount(item.id, parseInt(e.target.value) || 0)}
                          placeholder="..."
                          className="w-12 px-1 py-1 text-xs border rounded text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total y botón de cobrar */}
          <div className="border-t p-4 bg-gray-50">
            {totalDiscount > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} EUR</span>
              </div>
            )}
            {totalDiscount > 0 && (
              <div className="flex justify-between items-center text-sm text-red-500 mb-2">
                <span>Descuento</span>
                <span>-{totalDiscount.toFixed(2)} EUR</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">TOTAL</span>
              <span className="text-3xl font-bold text-yellow-600">{total.toFixed(2)} EUR</span>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-bold text-xl rounded-xl transition-colors"
            >
              COBRAR
            </button>
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Cobrar</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div className="text-center mb-6">
              <div className="text-sm text-gray-500">Total a cobrar</div>
              <div className="text-4xl font-bold text-yellow-600">{total.toFixed(2)} EUR</div>
            </div>

            {/* Métodos de pago */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {(['CASH', 'CARD', 'BIZUM', 'MIXED'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    paymentMethod === method
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {method === 'CASH' && 'Efectivo'}
                  {method === 'CARD' && 'Tarjeta'}
                  {method === 'BIZUM' && 'Bizum'}
                  {method === 'MIXED' && 'Mixto'}
                </button>
              ))}
            </div>

            {/* Campo de efectivo recibido */}
            {paymentMethod === 'CASH' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Efectivo recibido
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={total}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full px-4 py-4 text-2xl font-mono border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    placeholder={total.toFixed(2)}
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">EUR</span>
                </div>
                {change > 0 && (
                  <div className="mt-3 p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600">Cambio a devolver</div>
                    <div className="text-2xl font-bold text-green-700">{change.toFixed(2)} EUR</div>
                  </div>
                )}

                {/* Botones rápidos de efectivo */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[5, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCashReceived(amount.toString())}
                      className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    >
                      {amount} EUR
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSale}
              disabled={loading || (paymentMethod === 'CASH' && parseFloat(cashReceived || '0') < total)}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xl rounded-xl transition-colors"
            >
              {loading ? 'Procesando...' : 'Confirmar Venta'}
            </button>
          </div>
        </div>
      )}

      {/* Modal de cierre de caja */}
      {showCloseSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Cerrar Caja</h2>
              <button onClick={() => setShowCloseSessionModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Efectivo esperado en caja</div>
              <div className="text-2xl font-bold text-green-600">{session.totals.expectedCash.toFixed(2)} EUR</div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Efectivo contado
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    className="w-full px-4 py-3 text-xl font-mono border rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder={session.totals.expectedCash.toFixed(2)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">EUR</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total tarjeta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingCard}
                    onChange={(e) => setClosingCard(e.target.value)}
                    className="w-full px-4 py-3 font-mono border rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Bizum
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingBizum}
                    onChange={(e) => setClosingBizum(e.target.value)}
                    className="w-full px-4 py-3 font-mono border rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseSession}
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold text-xl rounded-xl transition-colors"
            >
              {loading ? 'Cerrando...' : 'Cerrar Caja'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
