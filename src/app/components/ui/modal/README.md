# app-modal (Desktop)

Componente primordial para sistemas de escritorio. Permite mostrar información detallada, formularios o advertencias sin obligar al usuario a abandonar la pantalla principal (como una tabla de registros). 

Incluye cierre automático al hacer clic fuera de la ventana (en el fondo oscuro) y soporte nativo para cerrar con la tecla **ESC**.

## Uso

En el componente TS que lo invoca:
```ts
isModalOpen = false;

abrirModal() {
  this.isModalOpen = true;
}

cerrarModal() {
  this.isModalOpen = false;
}
```

En el HTML:
```html
<app-button (onClick)="abrirModal()">Ver Detalles</app-button>

<app-modal [isOpen]="isModalOpen" title="Detalle de la Solicitud" maxWidth="2xl" (onClose)="cerrarModal()">
  <!-- Aquí va el contenido del modal, ej. un app-table o inputs -->
  <p class="text-gray-500">Información detallada...</p>
  
  <div class="mt-6 flex justify-end gap-2">
    <app-button variant="text" (onClick)="cerrarModal()">Cancelar</app-button>
    <app-button variant="primary">Guardar Cambios</app-button>
  </div>
</app-modal>
```

## Propiedades

- `isOpen`: `boolean`. Controla si el modal está visible o no.
- `title`: `string`. Título en la cabecera del modal.
- `maxWidth`: `'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'`. Ajusta el ancho máximo de la ventana modal. Default: `'md'`.
- `onClose`: `EventEmitter<void>`. Evento que se dispara al pulsar la 'X', el fondo oscuro o la tecla ESC. **Debe** ligarse a un método que ponga `isOpen` en `false`.
