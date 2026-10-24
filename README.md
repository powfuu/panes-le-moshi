# Panes le Moshi

Web de Panes le Moshi: presentación de la marca y pedidos online de pan de jamón venezolano con entrega en
A Coruña, Arteixo y Carballo. **Pago únicamente en efectivo a la entrega.**

Next.js 16 (App Router, Cache Components) · Tailwind CSS 4 · Framer Motion · Supabase.

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Las variables están en `.env.local` (ver `.env.example`). Solo se usa la clave
**pública** de Supabase; nunca pongas la `service_role` ni la `secret` en el proyecto.

## Páginas

| Ruta | Para qué |
| --- | --- |
| `/` | Portada: panes, historia, pago en efectivo, cómo funciona, zonas, preguntas frecuentes |
| `/pedir` | Pedido en 3 pasos: panes → entrega → datos y pago en efectivo |
| `/pedido/LM-XXXXXX?t=…` | Seguimiento en vivo del pedido (se actualiza solo cada 10 s) |
| `/seguimiento` | Buscar un pedido con código + teléfono, y pedidos hechos desde este dispositivo |
| `/admin` | Panel de pedidos (se abre con la clave de acceso) |

La plataforma **no tiene login**: los clientes siguen su pedido con su ticket (`LM-XXXXXX`) y el panel se abre
con una clave numérica.

## Estados del pedido

1. Procesando pedido: **único estado en el que se puede cancelar**
2. En preparación
3. Listo para la entrega
4. En reparto
5. Entregado

La regla de cancelación y los cambios de estado se aplican **en la base de datos** (trigger `orders_guard`),
así que no se pueden saltar ni desde el navegador ni desde el panel: solo se avanza o retrocede un paso cada
vez, y cancelar solo es posible desde «Procesando pedido».

## Panel de pedidos

Entra en `/admin` y escribe la clave de acceso. Marca «Recordar en este dispositivo» para no volver a escribirla.
El panel comprueba pedidos nuevos cada 10 segundos y avisa con un sonido.

- La clave se guarda cifrada con bcrypt en la tabla `admin_pins`; nunca en texto plano ni en el código.
- Tras 10 intentos fallidos desde la misma conexión, el acceso se bloquea 15 minutos.
- Para cambiar la clave, en Supabase → SQL Editor:

  ```sql
  delete from admin_pins;
  insert into admin_pins (pin_hash) values (extensions.crypt('NUEVA_CLAVE', extensions.gen_salt('bf', 10)));
  ```
## Cambiar precios, panes o zonas

Desde Supabase → **Table Editor**:

- `products`: nombre, descripción, `price_cents` (2000 = 20,00 €), `badge`, `active` para ocultar un pan.
  `variant` elige el dibujo: `clasico`, `familiar`, `sinpasas` o `mini`.
- `delivery_zones`: `delivery_fee_cents` (coste de entrega) y `min_order_cents` (pedido mínimo) por municipio.

La web refleja los cambios en un minuto aproximadamente.

## Seguridad

- RLS activado en todas las tablas. Los clientes **no pueden leer ni escribir** pedidos directamente.
- Todo pasa por funciones (`create_order`, `get_order`, `find_order`, `cancel_order`, `admin_list_orders`, `admin_set_status`)
  que validan los datos y **calculan precios y totales en el servidor**.
- Cada pedido tiene un token secreto; sin él (o sin el teléfono correcto) no se puede ver.
- Límite anti-abuso: máximo 3 pedidos por teléfono por hora.
- Entregas a partir del día siguiente y hasta 90 días vista.

El esquema está en `supabase/migrations/` (aplicar en orden).

## Publicar

La web es **100 % estática** (`output: "export"`): todo lo que cambia (carta, pedidos, seguimiento, panel) se lee
de Supabase desde el navegador, así que no hay servidor que mantener.

```bash
npm run build                                 # genera la carpeta out/
cd out && npx vercel deploy --prod --yes      # con una cuenta de Vercel iniciada
```

El seguimiento de cada ticket está en `/pedido/?c=LM-XXXXXX&t=<token>`.