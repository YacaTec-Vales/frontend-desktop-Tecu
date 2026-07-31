# app-button (Desktop)

Botón optimizado para entorno de escritorio (mouse y teclado). Cuenta con padding ligeramente más compacto que en móviles para acomodarse mejor en tablas densas, barras de herramientas y modales.

## Uso

```html
<app-button variant="primary" size="md" (onClick)="exportar()">
  Exportar a Excel
</app-button>

<app-button variant="text" size="sm">
  Cancelar
</app-button>
```

## Propiedades

- `variant`: `primary` | `secondary` | `outline` | `error` | `text` (Nuevo para desktop, muy útil en modales). Default: `primary`.
- `size`: `sm` | `md` | `lg`. Default: `md`.
- `disabled`: `boolean`. Default: `false`.
- `fullWidth`: `boolean`. Default: `false`.
- `type`: `button` | `submit` | `reset`. Default: `button`.
