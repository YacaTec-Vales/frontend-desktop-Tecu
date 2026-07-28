# frontend-desktop-Tecu

Dashboard web para administradores y gerentes de **Vales YacaTec**.

Web app construida con **Angular 22** y **Tailwind CSS v4**. Los tokens
visuales (paleta de colores, radios, sombras) vienen del submodulo
`src/styles` (repo `frontend-global-styles`) para mantener una sola fuente
de diseno en todo el sistema.

## Pre-requisitos

- Node.js 22+
- npm 11+
- Angular CLI 22 (`npm i -g @angular/cli@22`)

## Clonar el repositorio

Este proyecto depende del submodulo `src/styles`. Hay que traerlo en el
clonado, si no la carpeta queda vacia y los estilos globales no cargan.

### Via SSH (recomendado para el equipo)

```bash
git clone --recurse-submodules git@github.com:YacaTec-Vales/frontend-desktop-Tecu.git
```

### Via HTTPS

```bash
git clone --recurse-submodules https://github.com/YacaTec-Vales/frontend-desktop-Tecu.git
```

Si ya clonaste sin la flag:

```bash
git submodule init && git submodule update
```

## Instalar dependencias

```bash
npm install
```

## Levantar en desarrollo

```bash
npm start
```

Abre `http://localhost:4200/` y recarga automaticamente al editar el codigo.

## Build de produccion

```bash
npm run build
```

El compilado queda en `dist/`.

## Pruebas unitarias

```bash
npm test
```

Usa el runner [Vitest](https://vitest.dev/).

## Actualizar los estilos globales

Cuando alguien suba cambios a `frontend-global-styles`, los jalamos con:

```bash
git submodule update --remote src/styles
```

Y luego se hace commit del nuevo `src/styles` (gitlink) en este repo.

## Convencion de commits

Conventional Commits en espanol, lowercase, scope opcional entre parentesis,
sin linea de body.

Ejemplos:

- `feat(login): añadir formulario reactivo de acceso`
- `fix(dashboard): corregir totales en tarjeta de resumen`
- `chore(deps): actualizar angular a 22.1`
- `docs(readme): documentar flujo de submodulos`

## Mas info

- Repositorio de tokens visuales: [`frontend-global-styles`](../frontend-global-styles)
- Documentacion de Angular CLI: https://angular.dev/tools/cli

---

## Estructura Multirrepositorio y Configuración Local

Para que los estilos compartidos funcionen correctamente, debes asegurarte de que tu estructura de carpetas local sea exactamente la siguiente:

```text
📂 flobwite-beta (o cualquier nombre)
 ┣ 📂 frontend-global-styles
 ┣ 📂 frontend-mobile-poch
 ┣ 📂 frontend-tablet-calipx
 ┗ 📂 frontend-desktop-tecu
```

Una vez que tengas esta estructura, para instalar todo lo necesario, simplemente entra a la carpeta de este proyecto y ejecuta:

```bash
npm install
```
*(No es necesario ejecutar `npm install` en la carpeta `frontend-global-styles`)*.

### Configuración del Asistente de IA (MCP de Flowbite)

Si estás usando un agente de IA para ayudarte a codificar o diseñar nuevas pantallas, debes inicializar el servidor MCP oficial de Flowbite. Para hacerlo, ejecuta el siguiente comando en la raíz (donde están todos los repositorios):

```bash
npx -y flowbite-mcp
```
Esto le dará al agente acceso a todos los componentes de la librería.

### Diseño y Componentes

Nuestra aplicación utiliza **Flowbite** para la construcción de interfaces. Puedes encontrar la documentación oficial y ejemplos de código aquí:
👉 [Flowbite para Angular](https://flowbite.com/docs/getting-started/angular/)

**Color Principal (Marca):**
El color principal predeterminado de todo el sistema es el **Guindo**: `#600C0C`. Cualquier botón o elemento de acción principal debe respetar este color (a excepción de los estados de éxito, alerta o peligro).

#### Estructura de Componentes (Escritorio)

Este repositorio contiene los módulos para usuarios administrativos que trabajan desde una computadora de escritorio. Los roles que vas a encontrar aquí son:

1. **Administrador / Cajero**
   - Optimizados para velocidad y uso intensivo de teclado (Ej. buscar folios, pagar en ventanilla, cargar archivos de conciliación masivos).
2. **Gerente de Sucursal**
   - Interfaces para el manejo de personal, autorización de solicitudes, reasignación de carteras y gráficas operativas.
3. **Gerente General (Corporativo)**
   - Vistas globales con un sidebar oscuro ejecutivo, motor de configuración de reglas, catálogo de productos y visor inmutable de auditoría.