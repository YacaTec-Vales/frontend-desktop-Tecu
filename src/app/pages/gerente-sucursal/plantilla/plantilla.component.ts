import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';
import { BadgeComponent } from '../../../components/ui/badge/badge';

@Component({
  selector: 'app-plantilla',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, BadgeComponent],
  templateUrl: './plantilla.component.html'
})
export class PlantillaComponent {
  personal = [
    { id: 'EMP-201', nombre: 'Laura Martínez', rol: 'Coordinador', estado: 'Activo' },
    { id: 'EMP-202', nombre: 'Pedro Gómez', rol: 'Verificador', estado: 'Activo' },
    { id: 'EMP-203', nombre: 'Sofía Castro', rol: 'Cajera', estado: 'Inactivo' }
  ];

  isModalOpen = false;
  nuevoEmpleado = { nombre: '', rol: '' };

  abrirModal() {
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.nuevoEmpleado = { nombre: '', rol: '' };
  }

  guardarEmpleado() {
    if (this.nuevoEmpleado.nombre && this.nuevoEmpleado.rol) {
      this.personal.push({
        id: `EMP-20${this.personal.length + 1}`,
        nombre: this.nuevoEmpleado.nombre,
        rol: this.nuevoEmpleado.rol,
        estado: 'Activo'
      });
      this.cerrarModal();
    }
  }
}
