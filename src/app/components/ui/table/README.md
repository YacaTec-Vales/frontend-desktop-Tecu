# app-table (Desktop)

Componente central para la visualización de datos en el entorno de escritorio. Soporta scroll horizontal nativo (`overflow-x-auto`) en caso de que existan muchas columnas, lo cual es muy común en vistas gerenciales y de reportes.

## Uso

```html
<app-table [columns]="['ID', 'Cliente', 'Monto', 'Fecha', 'Acciones']" [isEmpty]="datos.length === 0" emptyMessage="No hay registros para este filtro.">
  <tr *ngFor="let row of datos" class="bg-white border-b hover:bg-gray-50 cursor-pointer">
    <td class="px-6 py-4">{{ row.id }}</td>
    <td class="px-6 py-4 font-medium">{{ row.cliente }}</td>
    <td class="px-6 py-4">{{ row.monto }}</td>
    <td class="px-6 py-4">{{ row.fecha }}</td>
    <td class="px-6 py-4">
      <app-button variant="text" size="sm">Ver Detalles</app-button>
    </td>
  </tr>
</app-table>
```

## Propiedades

- `columns`: `string[]`. Lista de encabezados.
- `isEmpty`: `boolean`. Si es true, oculta el `<tbody>` y muestra un estado vacío elegante.
- `emptyMessage`: `string`. Mensaje a mostrar cuando está vacío.
