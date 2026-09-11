# Consultorio del Amor 💘

App **Angular 22 + Supabase** para que los viewers de Twitch envíen confesiones anónimas, el admin las modere y el streamer las saque a pantalla bajo demanda en un overlay de OBS (1920×1080).

## Rutas

| Ruta | Función |
|------|---------|
| `/enviar` | Formulario anónimo del chat (categoría, título, confesión, pseudónimo) |
| `/admin/login` | Acceso restringido del panel |
| `/admin` | Panel de moderación: Pendientes / En cola / Rechazadas |
| `/overlay` | Overlay para OBS: "En cola: N" + **Traer siguiente** |

## Flujo

1. Un viewer envía su confesión 100% anónima (vía RPC `submit_confession`).
2. El **admin aprueba/rechaza** desde el panel (los contadores son exactos).
3. Aprobadas sin mostrar van a la **cola**.
4. El **streamer** pulsa **Traer siguiente** en el overlay → `mark_confession_shown()` marca atómicamente la más antigua y sale a pantalla.

## Requisitos

- Node 22+ y Angular CLI (`npm i -g @angular/cli`)
- Proyecto Supabase con tabla `confessions` y las funciones/políticas de `supabase/migracion_simplificada.sql` (ejecutar en el SQL Editor — es idempotente)
- Credenciales en `src/environments/environment.development.ts`

## Development server

```bash
npm start
```

Servidor en `http://localhost:4200/` (recarga automática).

## Build

```bash
ng build
```

El build de producción sale en `dist/confeciones_twitch/` (prereneriza `/enviar`).

## OBS

Agregar una fuente **Browser Source** con:

- URL: `http://localhost:4200/overlay`
- Ancho 1920, Alto 1080, fondo transparente
- Contar el botón **Traer siguiente** con el mouse (o un Hotkey/stream deck si prefieres)

> Nota: el overlay solo se ve en pantalla si hay al menos una confesión aprobada en cola.