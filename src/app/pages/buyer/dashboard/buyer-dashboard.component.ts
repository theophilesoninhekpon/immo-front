import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './buyer-dashboard.component.html',
  styleUrl: './buyer-dashboard.component.sass'
})
export class BuyerDashboardComponent implements OnInit {
  private propertyService = inject(PropertyService);

  properties: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.propertyService.getProperties({ per_page: 12 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.properties = response.data?.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}

