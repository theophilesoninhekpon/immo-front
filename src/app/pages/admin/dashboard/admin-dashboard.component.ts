import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { PropertyService } from '../../../services/property.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.sass'
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private propertyService = inject(PropertyService);

  stats: any = {};
  loading = true;

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.userService.getUserStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}

