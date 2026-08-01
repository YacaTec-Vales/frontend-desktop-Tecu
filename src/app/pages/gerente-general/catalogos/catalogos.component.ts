import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';
import { BadgeComponent } from '../../../components/ui/badge/badge';

type Tab = 'productos' | 'categorias' | 'sucursales' | 'personal';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, BadgeComponent],
  templateUrl: './catalogos.component.html'
})
export class CatalogosComponent {
  activeTab: Tab = 'productos';

  // State Modales
  isProductoModalOpen = false;
  isCategoriaModalOpen = false;
  isSucursalModalOpen = false;
  isPersonalModalOpen = false;

  // -- Datos Dummy --
  productos = [
    { id: 'VAL-1', monto: 5000, estado: 'Activo' },
    { id: 'VAL-2', monto: 10000, estado: 'Activo' },
  ];
  
  categorias = [
    { nombre: 'Plata', ganancia: 6 },
    { nombre: 'Oro', ganancia: 10 },
  ];

  sucursales = [
    { id: 'SUC-01', nombre: 'Matriz Principal', estado: 'Activo' },
    { id: 'SUC-02', nombre: 'Sucursal Norte', estado: 'Activo' },
  ];

  personal = [
    { id: 'EMP-120', nombre: 'Juan Pérez', rol: 'Coordinador', sucursal: 'Matriz Principal' },
    { id: 'EMP-121', nombre: 'Ana Gómez', rol: 'Verificadora', sucursal: 'Matriz Principal' },
  ];

  // Forms Models
  nuevoProducto = { monto: null };
  nuevaCategoria = { nombre: '', ganancia: null };
  nuevaSucursal = { nombre: '' };
  nuevoPersonal = { nombre: '', rol: '' };

  setTab(tab: Tab) {
    this.activeTab = tab;
  }

  // Productos
  abrirModalProducto() { this.isProductoModalOpen = true; }
  cerrarModalProducto() { this.isProductoModalOpen = false; this.nuevoProducto = { monto: null }; }
  guardarProducto() {
    if (this.nuevoProducto.monto) {
      this.productos.push({ id: `VAL-${this.productos.length + 1}`, monto: this.nuevoProducto.monto, estado: 'Activo' });
      this.cerrarModalProducto();
    }
  }

  // Categorias
  abrirModalCategoria() { this.isCategoriaModalOpen = true; }
  cerrarModalCategoria() { this.isCategoriaModalOpen = false; this.nuevaCategoria = { nombre: '', ganancia: null }; }
  guardarCategoria() {
    if (this.nuevaCategoria.nombre && this.nuevaCategoria.ganancia) {
      this.categorias.push({ ...this.nuevaCategoria } as any);
      this.cerrarModalCategoria();
    }
  }

  // Sucursales
  abrirModalSucursal() { this.isSucursalModalOpen = true; }
  cerrarModalSucursal() { this.isSucursalModalOpen = false; this.nuevaSucursal = { nombre: '' }; }
  guardarSucursal() {
    if (this.nuevaSucursal.nombre) {
      this.sucursales.push({ id: `SUC-0${this.sucursales.length + 1}`, nombre: this.nuevaSucursal.nombre, estado: 'Activo' });
      this.cerrarModalSucursal();
    }
  }

  // Personal
  abrirModalPersonal() { this.isPersonalModalOpen = true; }
  cerrarModalPersonal() { this.isPersonalModalOpen = false; this.nuevoPersonal = { nombre: '', rol: '' }; }
  guardarPersonal() {
    if (this.nuevoPersonal.nombre && this.nuevoPersonal.rol) {
      this.personal.push({ id: `EMP-1${this.personal.length + 1}`, nombre: this.nuevoPersonal.nombre, rol: this.nuevoPersonal.rol, sucursal: 'Matriz Principal' });
      this.cerrarModalPersonal();
    }
  }
}
