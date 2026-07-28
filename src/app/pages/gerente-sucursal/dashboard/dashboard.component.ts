import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexFill,
  ApexYAxis,
  ApexTooltip,
  ApexLegend
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  colors: string[];
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  stroke: any;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  public colocacionOptions: Partial<ChartOptions>;
  public morosidadOptions: Partial<ChartOptions>;

  constructor() {
    // Colocación de Dinero (Bar Chart)
    this.colocacionOptions = {
      series: [
        {
          name: 'Colocación',
          data: [120000, 150000, 140000, 180000, 220000, 210000]
        }
      ],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false }
      },
      colors: ['#7f1010'], // brand-strong
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      },
      title: {
        text: 'Dinero Colocado por Mes (MXN)',
        align: 'left'
      }
    };

    // Morosidad (Line Chart)
    this.morosidadOptions = {
      series: [
        {
          name: 'Cartera Vencida',
          data: [5, 5.2, 4.8, 6.1, 5.5, 4.9]
        }
      ],
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: false }
      },
      colors: ['#e63333'], // brand-500
      dataLabels: { enabled: true },
      xaxis: {
        categories: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      },
      title: {
        text: 'Índice de Morosidad (%)',
        align: 'left'
      },
      stroke: {
        curve: 'smooth'
      }
    } as any;
  }
}
