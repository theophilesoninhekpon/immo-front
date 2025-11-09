import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PropertyService } from '../../services/property.service';
import { PropertyInterestService } from '../../services/property-interest.service';

@Component({
  selector: 'app-buyer-dashboard-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './buyer-dashboard-layout.component.html',
  styleUrl: './buyer-dashboard-layout.component.sass'
})
export class BuyerDashboardLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private interestService = inject(PropertyInterestService);
  
  currentUser$ = this.authService.currentUser$;
  sidebarOpen = false; // Fermé par défaut sur mobile
  
  // Quick stats
  availablePropertiesCount = 0;
  myRequestsCount = 0;
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

    // Load available properties count
    this.propertyService.getProperties({ is_active: true, is_verified: true, per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.availablePropertiesCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            this.availablePropertiesCount = response.data.length;
          } else if (response.data?.data) {
            this.availablePropertiesCount = response.data.data.length;
          } else {
            this.availablePropertiesCount = 0;
          }
        }
      }
    });

    // Load my requests count
    this.interestService.getInterests({ per_page: 1 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.myRequestsCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            this.myRequestsCount = response.data.length;
          } else if (response.data?.data) {
            this.myRequestsCount = response.data.data.length;
          } else {
            this.myRequestsCount = 0;
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

  closeSidebarOnMobile(): void {
    // Fermer le sidebar sur mobile après navigation
    if (window.innerWidth < 768) {
      this.sidebarOpen = false;
    }
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

