# app-badge (Desktop)

Etiqueta visual pequeña, utilizada frecuentemente dentro de `app-table` para marcar estados ("CONCILIADO", "RECHAZADA", "EN PROCESO"). En Desktop se fuerza el uppercase y un tracking-wide para mejorar la legibilidad en pantallas grandes y densas.

## Uso

```html
<app-badge text="Verificada" variant="success"></app-badge>
<app-badge text="Pendiente" variant="warning"></app-badge>
<app-badge text="Cancelado" variant="error"></app-badge>
<app-badge text="Procesando" variant="info"></app-badge>
<app-badge text="Inactivo" variant="default"></app-badge>
```

## Propiedades

- `text`: `string`. Texto a mostrar.
- `variant`: `success` | `warning` | `error` | `info` | `default`. Default: `default`.
