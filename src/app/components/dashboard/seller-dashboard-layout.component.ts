import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PropertyService } from '../../services/property.service';
import { PropertyInterestService } from '../../services/property-interest.service';

@Component({
  selector: 'app-seller-dashboard-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './seller-dashboard-layout.component.html',
  styleUrl: './seller-dashboard-layout.component.sass'
})
export class SellerDashboardLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private interestService = inject(PropertyInterestService);
  
  currentUser$ = this.authService.currentUser$;
  sidebarOpen = true;
  
  // Quick stats
  myPropertiesCount = 0;
  pendingPropertiesCount = 0;
  pendingRequestsCount = 0;
  currentDate = new Date();
  searchQuery = '';

  ngOnInit(): void {
    this.loadQuickStats();
    // Update date every minute
    setInterval(() => {
      this.currentDate = new Date();
    }, 60000);
    
    // Refresh stats every 30 seconds
    setInterval(() => {
      this.loadQuickStats();
    }, 30000);
  }

  loadQuickStats(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return;

    // Load my properties count
    this.propertyService.getMyProperties().subscribe({
      next: (response) => {
        if (response.success) {
          let allProperties: any[] = [];
          if (Array.isArray(response.data)) {
            allProperties = response.data;
          } else if (response.data?.data) {
            allProperties = response.data.data;
          }
          
          // Compter uniquement les biens validés/publiés (status === 'available' ou is_verified === true)
          this.myPropertiesCount = allProperties.filter((p: any) => 
            p.status === 'available' || p.is_verified === true
          ).length;
          
          // Compter les biens en attente de validation
          this.pendingPropertiesCount = allProperties.filter((p: any) => 
            p.status === 'pending_verification' || (p.is_verified === false && p.status !== 'rejected')
          ).length;
        }
      }
    });

    // Load pending requests count (requests for my properties)
    this.interestService.getInterests({ status: 'pending', per_page: 1 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.pendingRequestsCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            this.pendingRequestsCount = response.data.length;
          } else if (response.data?.data) {
            this.pendingRequestsCount = response.data.data.length;
          } else {
            this.pendingRequestsCount = 0;
          }
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  formatDate(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatTime(): string {
    return this.currentDate.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
