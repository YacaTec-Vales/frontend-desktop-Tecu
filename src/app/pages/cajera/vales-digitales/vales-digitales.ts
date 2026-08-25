import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoucherService, VoucherDetails } from '../../../core/services/voucher.service';
import { TableComponent } from '../../../components/ui/table/table';
import { CardComponent } from '../../../components/ui/card/card';
import { BadgeComponent } from '../../../components/ui/badge/badge';

@Component({
  selector: 'app-vales-digitales',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, CardComponent, BadgeComponent],
  templateUrl: './vales-digitales.html'
})
export class ValesDigitalesComponent implements OnInit {
  vales: any[] = [];
  isLoading = true;
  
  // Paginación local (simulada por ahora)
  page = 1;
  limit = 10;
  totalItems = 0;
  searchQuery = '';

  constructor(private voucherService: VoucherService) {}

  ngOnInit() {
    this.loadVouchers();
  }

  loadVouchers() {
    this.isLoading = true;
    this.voucherService.getVouchers('ACTIVO', 'PREVALE', 50).subscribe({
      next: (res) => {
        const vouchersArray = res.data?.vouchers || res.data?.data || res.data || [];
        this.vales = Array.isArray(vouchersArray) ? vouchersArray.map((v: any) => ({
          folio: v.folio,
          cliente: v.distributor?.generalData ? `${v.distributor.generalData.nombre} ${v.distributor.generalData.apellido_paterno}` : (v.clientId || v.distributorId || 'Desconocido'),
          tipo: v.voucherType === 'PREVALE' ? 'Pre-Vale' : 'Digital',
          montoPesos: v.amountCents / 100,
          status: v.status,
          fecha: v.createdAt
        })) : [];
        this.totalItems = this.vales.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching vouchers', err);
        this.isLoading = false;
      }
    });
  }

  get paginatedList() {
    let list = this.vales;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item => 
        item.folio.toLowerCase().includes(q) || 
        item.cliente.toLowerCase().includes(q)
      );
    }
    const start = (this.page - 1) * this.limit;
    return list.slice(start, start + this.limit);
  }

  get totalFilteredItems() {
    let list = this.vales;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item => 
        item.folio.toLowerCase().includes(q) || 
        item.cliente.toLowerCase().includes(q)
      );
    }
    return list.length;
  }

  onPageChange(page: number) {
    this.page = page;
  }

  onSearch(term: string) {
    this.searchQuery = term;
    this.page = 1;
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page = 1;
  }
}
