# app-input (Desktop)

Componente de formulario base para la aplicación de escritorio. Soporta múltiples tipos, incluyendo entrada de archivos `file` con soporte "drag & drop" visual, y campo `date` esencial para reportes gerenciales.

Soporta Two-Way Data Binding completo con `[(ngModel)]`.

## Uso

```html
<!-- Búsquedas y filtros -->
<app-input label="Folio a buscar" type="text" [(ngModel)]="folio" placeholder="Ej: PRE-1234"></app-input>

<!-- Fechas (Reportes) -->
<app-input label="Fecha de inicio" type="date" [(ngModel)]="fechaInicio"></app-input>

<!-- Subir Excel (Conciliación) -->
<app-input label="Estado de Cuenta" type="file" accept=".xlsx,.xls" [(ngModel)]="archivoBanco"></app-input>
```

## Propiedades

- `label`: `string`.
- `type`: `text` | `email` | `password` | `number` | `date` | `textarea` | `file`. Default: `text`.
- `placeholder`: `string`.
- `hint`: `string` (Texto de ayuda debajo).
- `disabled`: `boolean`. Default: `false`.
- `rows`: `number` (Solo para textarea). Default: `4`.
- `accept`: `string` (Solo para file, Ej: '.pdf').
