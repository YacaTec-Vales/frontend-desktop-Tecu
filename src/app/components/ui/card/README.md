# app-card (Desktop)

Contenedor principal para agrupar información. En Desktop, las tarjetas tienen bordes más sutiles y pueden carecer de padding cuando contienen Data Tables densas.

## Uso

```html
<app-card title="Filtros de Búsqueda" subtitle="Filtra por fecha y sucursal">
  <!-- Inputs de filtro aquí -->
</app-card>

<app-card title="Bandeja" [noPadding]="true">
  <!-- app-table aquí (se pegará a los bordes) -->
</app-card>
```

## Propiedades

- `title`: `string`.
- `subtitle`: `string`.
- `noPadding`: `boolean`. Default: `false`. Desactiva el padding del body (ideal para envolver tablas).
- `extraClasses`: `string`. Útil para añadir colores de borde, ej: `border-t-4 border-t-brand`.
