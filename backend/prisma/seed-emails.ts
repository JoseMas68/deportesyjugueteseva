import { PrismaClient, EmailType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📧 Insertando plantillas de email...')

  const emailTemplates = [
    {
      type: EmailType.CONFIRMATION,
      subject: 'Tu pedido {order_number} ha sido recibido - Deportes y Juguetes Eva',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f4f4f4; padding: 0;">
  <div style="background: #000; padding: 30px; text-align: center;">
    <h1 style="color: #FFF64C; margin: 0; font-size: 32px; font-weight: bold;">EVA</h1>
    <p style="color: #fff; margin: 10px 0 0 0; font-size: 14px;">DEPORTES Y JUGUETES</p>
  </div>

  <div style="background: #fff; padding: 40px 30px;">
    <h2 style="color: #000; margin-top: 0;">¡Gracias por tu compra, {user_name}!</h2>

    <p>Hemos recibido tu pedido <strong>{order_number}</strong> y estamos procesándolo.</p>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #000; margin-top: 0; margin-bottom: 15px;">Resumen del pedido</h3>
      {products}
    </div>

    <div style="margin: 30px 0; padding-top: 20px; border-top: 2px solid #eee;">
      <table style="width: 100%; font-size: 16px;">
        <tr>
          <td style="padding: 8px 0;"><strong>Subtotal:</strong></td>
          <td style="text-align: right; padding: 8px 0;">{subtotal}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Envío:</strong></td>
          <td style="text-align: right; padding: 8px 0;">{shipping_cost}</td>
        </tr>
        <tr style="font-size: 20px; color: #FFF64C; background: #000;">
          <td style="padding: 15px;"><strong>Total:</strong></td>
          <td style="text-align: right; padding: 15px;"><strong>{total}</strong></td>
        </tr>
      </table>
    </div>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #000; margin-top: 0;">📍 Dirección de envío:</h3>
      <p style="margin: 0; white-space: pre-line;">{address}</p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/cuenta/pedidos"
         style="background: #FFF64C; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
        Ver mis pedidos
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">¿Tienes alguna pregunta? Responde a este email o escríbenos a <a href="mailto:deporteseva@gmail.com" style="color: #000;">deporteseva@gmail.com</a></p>
  </div>

  <div style="background: #000; padding: 30px; text-align: center; color: #999; font-size: 14px;">
    <p style="margin: 5px 0; color: #FFF64C; font-weight: bold;">Deportes y Juguetes Eva</p>
    <p style="margin: 5px 0;">C/San Pascual 19, 12540 Vila-Real (Castellón)</p>
    <p style="margin: 5px 0;">Tel: 964 521 238</p>
    <p style="margin: 15px 0 5px 0; font-size: 12px;">© 2026 Todos los derechos reservados</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.PAID,
      subject: '✅ Pago confirmado - Pedido {order_number}',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f4f4f4; padding: 0;">
  <div style="background: #000; padding: 30px; text-align: center;">
    <h1 style="color: #FFF64C; margin: 0; font-size: 32px; font-weight: bold;">EVA</h1>
    <p style="color: #fff; margin: 10px 0 0 0; font-size: 14px;">DEPORTES Y JUGUETES</p>
  </div>

  <div style="background: #fff; padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: #d4edda; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">✅</span>
      </div>
    </div>

    <h2 style="color: #28a745; text-align: center; margin-top: 0;">¡Pago confirmado!</h2>

    <p>Hola <strong>{user_name}</strong>,</p>
    <p>Hemos recibido el pago de tu pedido <strong>{order_number}</strong>.</p>

    <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #155724; font-size: 18px;">
        <strong>💰 Importe pagado: {total}</strong>
      </p>
    </div>

    <p>Ahora estamos preparando tu pedido con todo el cariño. Te avisaremos en cuanto lo enviemos.</p>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #000; margin-top: 0;">📦 Próximos pasos:</h3>
      <ol style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">Preparamos tu pedido (1-2 días laborables)</li>
        <li style="margin-bottom: 8px;">Lo enviamos y te mandamos el número de seguimiento</li>
        <li>¡Disfruta de tu compra!</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/cuenta/pedidos"
         style="background: #FFF64C; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
        Ver mi pedido
      </a>
    </div>
  </div>

  <div style="background: #000; padding: 30px; text-align: center; color: #999; font-size: 14px;">
    <p style="margin: 5px 0; color: #FFF64C; font-weight: bold;">Deportes y Juguetes Eva</p>
    <p style="margin: 5px 0;">C/San Pascual 19, 12540 Vila-Real (Castellón)</p>
    <p style="margin: 15px 0 5px 0; font-size: 12px;">© 2026 Todos los derechos reservados</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.SHIPPED,
      subject: '📦 ¡Tu pedido {order_number} está en camino!',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f4f4f4; padding: 0;">
  <div style="background: #000; padding: 30px; text-align: center;">
    <h1 style="color: #FFF64C; margin: 0; font-size: 32px; font-weight: bold;">EVA</h1>
    <p style="color: #fff; margin: 10px 0 0 0; font-size: 14px;">DEPORTES Y JUGUETES</p>
  </div>

  <div style="background: #fff; padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 60px;">🚚</span>
    </div>

    <h2 style="color: #000; text-align: center; margin-top: 0;">¡Tu pedido está en camino!</h2>

    <p>Hola <strong>{user_name}</strong>,</p>
    <p>¡Buenas noticias! Tu pedido <strong>{order_number}</strong> ya está de camino a tu dirección.</p>

    <div style="background: #000; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #999; font-size: 14px;">NÚMERO DE SEGUIMIENTO</p>
      <p style="margin: 0; font-size: 24px; color: #FFF64C; font-weight: bold; letter-spacing: 2px;">{tracking_number}</p>
    </div>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #000; margin-top: 0;">📍 Dirección de entrega:</h3>
      <p style="margin: 0; white-space: pre-line;">{address}</p>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>💡 Consejo:</strong> Asegúrate de que alguien pueda recibir el paquete. Si no estás, el transportista dejará un aviso.
      </p>
    </div>

    <p>El tiempo de entrega estimado es de <strong>24-48 horas laborables</strong> (península).</p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/cuenta/pedidos"
         style="background: #FFF64C; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
        Seguir mi pedido
      </a>
    </div>
  </div>

  <div style="background: #000; padding: 30px; text-align: center; color: #999; font-size: 14px;">
    <p style="margin: 5px 0; color: #FFF64C; font-weight: bold;">Deportes y Juguetes Eva</p>
    <p style="margin: 5px 0;">C/San Pascual 19, 12540 Vila-Real (Castellón)</p>
    <p style="margin: 15px 0 5px 0; font-size: 12px;">© 2026 Todos los derechos reservados</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.CANCELLED,
      subject: 'Pedido {order_number} cancelado',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f4f4f4; padding: 0;">
  <div style="background: #000; padding: 30px; text-align: center;">
    <h1 style="color: #FFF64C; margin: 0; font-size: 32px; font-weight: bold;">EVA</h1>
    <p style="color: #fff; margin: 10px 0 0 0; font-size: 14px;">DEPORTES Y JUGUETES</p>
  </div>

  <div style="background: #fff; padding: 40px 30px;">
    <h2 style="color: #000; margin-top: 0;">Pedido cancelado</h2>

    <p>Hola <strong>{user_name}</strong>,</p>
    <p>Te confirmamos que tu pedido <strong>{order_number}</strong> ha sido cancelado.</p>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">📋 Motivo de la cancelación:</p>
      <p style="margin: 0; color: #856404;">{cancellation_reason}</p>
    </div>

    <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #155724;">
        <strong>💰 Reembolso:</strong> Si ya habías realizado el pago, el importe de <strong>{total}</strong> será reembolsado en un plazo de 5-7 días laborables en el mismo método de pago utilizado.
      </p>
    </div>

    <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estaremos encantados de atenderte.</p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/"
         style="background: #FFF64C; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
        Seguir comprando
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">¿Necesitas ayuda? Escríbenos a <a href="mailto:deporteseva@gmail.com" style="color: #000;">deporteseva@gmail.com</a> o llámanos al <strong>964 521 238</strong></p>
  </div>

  <div style="background: #000; padding: 30px; text-align: center; color: #999; font-size: 14px;">
    <p style="margin: 5px 0; color: #FFF64C; font-weight: bold;">Deportes y Juguetes Eva</p>
    <p style="margin: 5px 0;">C/San Pascual 19, 12540 Vila-Real (Castellón)</p>
    <p style="margin: 15px 0 5px 0; font-size: 12px;">© 2026 Todos los derechos reservados</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.ADMIN_NEW_ORDER,
      subject: '🔔 Nuevo pedido {order_number} - {total}',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #1a1a1a; color: #fff; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: #FFF64C; color: #000; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">🔔 NUEVO PEDIDO</h1>
    </div>

    <div style="background: #2d2d2d; padding: 30px; border-radius: 0 0 8px 8px;">
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #444;">
            <strong style="color: #999;">Pedido:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #444; text-align: right;">
            <span style="color: #FFF64C; font-weight: bold; font-size: 18px;">{order_number}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #444;">
            <strong style="color: #999;">Cliente:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #444; text-align: right;">
            {user_name}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #444;">
            <strong style="color: #999;">Email:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #444; text-align: right;">
            <a href="mailto:{user_email}" style="color: #FFF64C;">{user_email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #999;">Total:</strong>
          </td>
          <td style="padding: 10px 0; text-align: right;">
            <span style="color: #4CAF50; font-weight: bold; font-size: 24px;">{total}</span>
          </td>
        </tr>
      </table>

      <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #FFF64C; margin-top: 0;">📦 Productos:</h3>
        {products}
      </div>

      <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #FFF64C; margin-top: 0;">📍 Dirección de envío:</h3>
        <p style="margin: 0; white-space: pre-line; color: #ccc;">{address}</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="{admin_link}"
           style="background: #FFF64C; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          VER PEDIDO EN ADMIN
        </a>
      </div>
    </div>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.ADMIN_PAID,
      subject: '✅ Pedido {order_number} PAGADO - {total}',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #1a1a1a; color: #fff; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: #4CAF50; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">✅ PAGO RECIBIDO</h1>
    </div>

    <div style="background: #2d2d2d; padding: 30px; border-radius: 0 0 8px 8px;">
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #444;">
            <strong style="color: #999;">Pedido:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #444; text-align: right;">
            <span style="color: #FFF64C; font-weight: bold; font-size: 18px;">{order_number}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #444;">
            <strong style="color: #999;">Cliente:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #444; text-align: right;">
            {user_name}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #999;">Importe pagado:</strong>
          </td>
          <td style="padding: 10px 0; text-align: right;">
            <span style="color: #4CAF50; font-weight: bold; font-size: 24px;">{total}</span>
          </td>
        </tr>
      </table>

      <div style="background: #1b4332; border-left: 4px solid #4CAF50; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #a3d9a5;">
          <strong>💡 Acción requerida:</strong> Prepara el pedido para envío
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="{admin_link}"
           style="background: #4CAF50; color: #fff; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          PREPARAR ENVÍO
        </a>
      </div>
    </div>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.ADMIN_CANCELLED,
      subject: '❌ Pedido {order_number} CANCELADO',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #1a1a1a; color: #fff; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: #dc3545; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">❌ PEDIDO CANCELADO</h1>
    </div>

    <div style="background: #2d2d2d; padding: 30px; border-radius: 0 0 8px 8px;">
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #444;">
            <strong style="color: #999;">Pedido:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #444; text-align: right;">
            <span style="color: #FFF64C; font-weight: bold; font-size: 18px;">{order_number}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #444;">
            <strong style="color: #999;">Cliente:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #444; text-align: right;">
            {user_name} ({user_email})
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #999;">Importe:</strong>
          </td>
          <td style="padding: 10px 0; text-align: right;">
            <span style="color: #dc3545; font-weight: bold; font-size: 24px;">{total}</span>
          </td>
        </tr>
      </table>

      <div style="background: #3d1f22; border-left: 4px solid #dc3545; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 10px 0; color: #f5c6cb;"><strong>Motivo de cancelación:</strong></p>
        <p style="margin: 0; color: #f5c6cb;">{cancellation_reason}</p>
      </div>

      <div style="background: #1a1a1a; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #ffc107;">
          <strong>💰 Nota:</strong> Si el cliente ya había pagado, procesar reembolso.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="{admin_link}"
           style="background: #dc3545; color: #fff; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          VER DETALLES
        </a>
      </div>
    </div>
  </div>
</body>
</html>`,
    },
  ]

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type: template.type },
      update: {
        subject: template.subject,
        body: template.body,
        isActive: true,
      },
      create: {
        ...template,
        isActive: true,
      },
    })
    console.log(`  ✅ ${template.type}`)
  }

  console.log('\n🎉 ¡Plantillas de email insertadas correctamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
