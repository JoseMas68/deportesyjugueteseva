import { PrismaClient, EmailType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📧 Actualizando plantillas de email con contenido completo...')

  const emailTemplates = [
    {
      type: EmailType.CONFIRMATION,
      subject: '¡Gracias por tu pedido {order_number}! - Deportes y Juguetes Eva',
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
    <h2 style="color: #000; margin-top: 0;">¡Hola {user_name}! 👋</h2>

    <p style="font-size: 16px;">¡Muchas gracias por confiar en nosotros! Hemos recibido tu pedido y ya estamos trabajando en él.</p>

    <div style="background: #FFF64C; padding: 15px 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #000;"><strong>📦 Número de pedido:</strong></p>
      <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #000;">{order_number}</p>
    </div>

    <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #000; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">🛒 Tu pedido incluye:</h3>
      {products}
    </div>

    <div style="margin: 30px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Subtotal</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">{subtotal}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Gastos de envío</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">{shipping_cost}</td>
        </tr>
        <tr>
          <td style="padding: 15px 0; font-size: 18px; font-weight: bold;">TOTAL</td>
          <td style="padding: 15px 0; text-align: right; font-size: 22px; font-weight: bold; color: #000;">{total}</td>
        </tr>
      </table>
    </div>

    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="margin: 0 0 10px 0; color: #0369a1;">📍 Dirección de envío</h4>
      <p style="margin: 0; color: #334155; white-space: pre-line;">{address}</p>
    </div>

    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="margin: 0 0 10px 0; color: #166534;">⏰ ¿Qué pasa ahora?</h4>
      <ol style="margin: 0; padding-left: 20px; color: #334155;">
        <li style="margin-bottom: 5px;">Preparamos tu pedido con mucho cuidado</li>
        <li style="margin-bottom: 5px;">Te enviamos un email cuando lo enviemos</li>
        <li>¡Lo recibes en casa en 24-48h!</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/cuenta/pedidos"
         style="background: #000; color: #FFF64C; padding: 16px 48px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
        Ver mi pedido
      </a>
    </div>

    <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
      ¿Tienes alguna pregunta? Escríbenos a <a href="mailto:deporteseva@gmail.com" style="color: #000; font-weight: 500;">deporteseva@gmail.com</a><br>
      o llámanos al <strong>964 521 238</strong>
    </p>
  </div>

  <div style="background: #000; padding: 30px; text-align: center;">
    <p style="margin: 0 0 5px 0; color: #FFF64C; font-weight: bold; font-size: 16px;">Deportes y Juguetes Eva</p>
    <p style="margin: 0; color: #999; font-size: 13px;">C/San Pascual 19, 12540 Vila-Real (Castellón)</p>
    <p style="margin: 15px 0 0 0; color: #666; font-size: 12px;">© 2026 Todos los derechos reservados</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.PAID,
      subject: '✅ ¡Pago confirmado! Tu pedido {order_number} está en marcha',
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
      <div style="background: #dcfce7; border-radius: 50%; width: 100px; height: 100px; margin: 0 auto; display: inline-flex; align-items: center; justify-content: center;">
        <span style="font-size: 50px;">✅</span>
      </div>
    </div>

    <h2 style="color: #166534; text-align: center; margin-top: 0;">¡Pago recibido correctamente!</h2>

    <p style="font-size: 16px; text-align: center;">Hola <strong>{user_name}</strong>, hemos confirmado el pago de tu pedido.</p>

    <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 5px 0; color: #166534; font-size: 14px;">Pedido</p>
      <p style="margin: 0 0 15px 0; color: #000; font-size: 20px; font-weight: bold;">{order_number}</p>
      <p style="margin: 0 0 5px 0; color: #166534; font-size: 14px;">Importe pagado</p>
      <p style="margin: 0; color: #166534; font-size: 28px; font-weight: bold;">{total}</p>
    </div>

    <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #000; margin-top: 0;">📦 Próximos pasos:</h3>
      <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
        <span style="background: #FFF64C; color: #000; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</span>
        <div>
          <p style="margin: 0; font-weight: 500;">Preparamos tu pedido</p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Nuestro equipo está empaquetando tus productos con cuidado</p>
        </div>
      </div>
      <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
        <span style="background: #e5e7eb; color: #000; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</span>
        <div>
          <p style="margin: 0; font-weight: 500;">Enviamos tu pedido</p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Te enviaremos un email con el número de seguimiento</p>
        </div>
      </div>
      <div style="display: flex; align-items: flex-start;">
        <span style="background: #e5e7eb; color: #000; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</span>
        <div>
          <p style="margin: 0; font-weight: 500;">¡Disfruta!</p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Recibe tu pedido en 24-48h laborables</p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/cuenta/pedidos"
         style="background: #000; color: #FFF64C; padding: 16px 48px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
        Seguir mi pedido
      </a>
    </div>

    <p style="color: #666; font-size: 14px; text-align: center;">
      ¿Necesitas ayuda? Escríbenos a <a href="mailto:deporteseva@gmail.com" style="color: #000;">deporteseva@gmail.com</a>
    </p>
  </div>

  <div style="background: #000; padding: 30px; text-align: center;">
    <p style="margin: 0 0 5px 0; color: #FFF64C; font-weight: bold;">Deportes y Juguetes Eva</p>
    <p style="margin: 0; color: #999; font-size: 13px;">C/San Pascual 19, 12540 Vila-Real</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.SHIPPED,
      subject: '🚚 ¡Tu pedido {order_number} está en camino!',
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
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 70px;">🚚</span>
    </div>

    <h2 style="color: #000; text-align: center; margin-top: 0;">¡Tu pedido va volando hacia ti!</h2>

    <p style="font-size: 16px; text-align: center;">Hola <strong>{user_name}</strong>, ¡buenas noticias! Tu pedido ya está de camino.</p>

    <div style="background: #000; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Número de seguimiento</p>
      <p style="margin: 0; font-size: 28px; color: #FFF64C; font-weight: bold; letter-spacing: 3px;">{tracking_number}</p>
      <p style="margin: 15px 0 0 0; color: #999; font-size: 13px;">Usa este código para rastrear tu envío</p>
    </div>

    <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="font-size: 30px;">📦</span>
        <div>
          <p style="margin: 0; font-weight: bold; color: #92400e;">Pedido: {order_number}</p>
          <p style="margin: 5px 0 0 0; color: #a16207; font-size: 14px;">Entrega estimada: 24-48 horas laborables</p>
        </div>
      </div>
    </div>

    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="margin: 0 0 10px 0; color: #0369a1;">📍 Se entregará en:</h4>
      <p style="margin: 0; color: #334155; white-space: pre-line;">{address}</p>
    </div>

    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #c2410c; font-size: 14px;">
        <strong>💡 Consejo:</strong> Asegúrate de que alguien pueda recibir el paquete. Si no estás, el transportista dejará un aviso.
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/cuenta/pedidos"
         style="background: #000; color: #FFF64C; padding: 16px 48px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
        Rastrear mi pedido
      </a>
    </div>

    <p style="color: #666; font-size: 14px; text-align: center;">
      ¿Algún problema con la entrega? Llámanos al <strong>964 521 238</strong>
    </p>
  </div>

  <div style="background: #000; padding: 30px; text-align: center;">
    <p style="margin: 0 0 5px 0; color: #FFF64C; font-weight: bold;">Deportes y Juguetes Eva</p>
    <p style="margin: 0; color: #999; font-size: 13px;">C/San Pascual 19, 12540 Vila-Real</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.CANCELLED,
      subject: 'Tu pedido {order_number} ha sido cancelado',
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
    <h2 style="color: #000; margin-top: 0;">Hola {user_name},</h2>

    <p style="font-size: 16px;">Te confirmamos que tu pedido <strong>{order_number}</strong> ha sido cancelado.</p>

    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="margin: 0 0 10px 0; color: #991b1b;">📋 Motivo de la cancelación</h4>
      <p style="margin: 0; color: #7f1d1d;">{cancellation_reason}</p>
    </div>

    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="margin: 0 0 10px 0; color: #166534;">💰 Sobre el reembolso</h4>
      <p style="margin: 0; color: #166534;">
        Si ya habías realizado el pago de <strong>{total}</strong>, el importe será reembolsado automáticamente en un plazo de <strong>5-7 días laborables</strong> en el mismo método de pago que utilizaste.
      </p>
    </div>

    <p style="font-size: 15px; color: #666;">
      Lamentamos los inconvenientes que esto pueda causarte. Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/"
         style="background: #000; color: #FFF64C; padding: 16px 48px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
        Volver a la tienda
      </a>
    </div>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">¿Necesitas ayuda?</p>
      <p style="margin: 0;">
        <a href="mailto:deporteseva@gmail.com" style="color: #000; font-weight: 500;">deporteseva@gmail.com</a>
        <span style="color: #ccc; margin: 0 10px;">|</span>
        <strong>964 521 238</strong>
      </p>
    </div>
  </div>

  <div style="background: #000; padding: 30px; text-align: center;">
    <p style="margin: 0 0 5px 0; color: #FFF64C; font-weight: bold;">Deportes y Juguetes Eva</p>
    <p style="margin: 0; color: #999; font-size: 13px;">C/San Pascual 19, 12540 Vila-Real</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.ADMIN_NEW_ORDER,
      subject: '🔔 ¡Nuevo pedido! {order_number} - {total}',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 0; margin: 0; background: #1a1a1a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #FFF64C 0%, #fbbf24 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #000; font-size: 28px;">🔔 ¡NUEVO PEDIDO!</h1>
    </div>

    <div style="background: #2d2d2d; padding: 30px; border-radius: 0 0 12px 12px;">
      <div style="background: #1a1a1a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <table style="width: 100%;">
          <tr>
            <td style="color: #999; padding: 8px 0;">Pedido</td>
            <td style="color: #FFF64C; font-weight: bold; font-size: 18px; text-align: right;">{order_number}</td>
          </tr>
          <tr>
            <td style="color: #999; padding: 8px 0;">Cliente</td>
            <td style="color: #fff; text-align: right;">{user_name}</td>
          </tr>
          <tr>
            <td style="color: #999; padding: 8px 0;">Email</td>
            <td style="text-align: right;"><a href="mailto:{user_email}" style="color: #FFF64C;">{user_email}</a></td>
          </tr>
          <tr>
            <td style="color: #999; padding: 8px 0;">Total</td>
            <td style="color: #4ade80; font-weight: bold; font-size: 24px; text-align: right;">{total}</td>
          </tr>
        </table>
      </div>

      <div style="background: #1a1a1a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #FFF64C; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase;">📦 Productos</h3>
        <div style="color: #ccc;">
          {products}
        </div>
      </div>

      <div style="background: #1a1a1a; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h3 style="color: #FFF64C; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase;">📍 Enviar a</h3>
        <p style="color: #ccc; margin: 0; white-space: pre-line;">{address}</p>
      </div>

      <div style="text-align: center;">
        <a href="{admin_link}"
           style="background: #FFF64C; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          GESTIONAR PEDIDO
        </a>
      </div>
    </div>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.ADMIN_PAID,
      subject: '✅ ¡Pago recibido! {order_number} - {total}',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 0; margin: 0; background: #1a1a1a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #fff; font-size: 28px;">✅ ¡PAGO CONFIRMADO!</h1>
    </div>

    <div style="background: #2d2d2d; padding: 30px; border-radius: 0 0 12px 12px;">
      <div style="background: #1a1a1a; border-radius: 8px; padding: 25px; margin-bottom: 20px; text-align: center;">
        <p style="color: #999; margin: 0 0 5px 0; font-size: 14px;">Pedido</p>
        <p style="color: #FFF64C; margin: 0 0 20px 0; font-size: 20px; font-weight: bold;">{order_number}</p>
        <p style="color: #999; margin: 0 0 5px 0; font-size: 14px;">Cliente</p>
        <p style="color: #fff; margin: 0 0 20px 0; font-size: 16px;">{user_name}</p>
        <p style="color: #999; margin: 0 0 5px 0; font-size: 14px;">Importe pagado</p>
        <p style="color: #4ade80; margin: 0; font-size: 32px; font-weight: bold;">{total}</p>
      </div>

      <div style="background: #14532d; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="color: #86efac; margin: 0; text-align: center;">
          <strong>⚡ Acción requerida:</strong> Preparar el pedido para envío
        </p>
      </div>

      <div style="text-align: center;">
        <a href="{admin_link}"
           style="background: #22c55e; color: #fff; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
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
      subject: '❌ Pedido cancelado: {order_number}',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 0; margin: 0; background: #1a1a1a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #fff; font-size: 28px;">❌ PEDIDO CANCELADO</h1>
    </div>

    <div style="background: #2d2d2d; padding: 30px; border-radius: 0 0 12px 12px;">
      <div style="background: #1a1a1a; border-radius: 8px; padding: 25px; margin-bottom: 20px; text-align: center;">
        <p style="color: #999; margin: 0 0 5px 0; font-size: 14px;">Pedido</p>
        <p style="color: #FFF64C; margin: 0 0 20px 0; font-size: 20px; font-weight: bold;">{order_number}</p>
        <p style="color: #999; margin: 0 0 5px 0; font-size: 14px;">Cliente</p>
        <p style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">{user_name}</p>
        <p style="color: #999; margin: 0 0 20px 0; font-size: 14px;">{user_email}</p>
        <p style="color: #999; margin: 0 0 5px 0; font-size: 14px;">Importe</p>
        <p style="color: #f87171; margin: 0; font-size: 24px; font-weight: bold;">{total}</p>
      </div>

      <div style="background: #450a0a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p style="color: #fca5a5; margin: 0 0 10px 0; font-weight: bold;">Motivo de cancelación:</p>
        <p style="color: #fecaca; margin: 0;">{cancellation_reason}</p>
      </div>

      <div style="background: #422006; border-radius: 8px; padding: 15px 20px; margin-bottom: 25px;">
        <p style="color: #fcd34d; margin: 0; font-size: 14px;">
          <strong>💰 Nota:</strong> Si el cliente ya había pagado, verificar que el reembolso se procese correctamente.
        </p>
      </div>

      <div style="text-align: center;">
        <a href="{admin_link}"
           style="background: #ef4444; color: #fff; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
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

  console.log('\n🎉 ¡Plantillas actualizadas con contenido profesional!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
