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