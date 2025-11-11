import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { PropertyService } from '../../services/property.service';
import { PropertyInterestService } from '../../services/property-interest.service';

@Component({
  selector: 'app-admin-dashboard-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-dashboard-layout.component.html',
  styleUrl: './admin-dashboard-layout.component.sass'
})
export class AdminDashboardLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);
  private propertyService = inject(PropertyService);
  private interestService = inject(PropertyInterestService);
  
  currentUser$ = this.authService.currentUser$;
  sidebarOpen = false; // Sera initialisé selon la taille d'écran
  isDesktop = false;
  
  // Quick stats
  pendingSellersCount = 0;
  pendingPropertiesCount = 0;
  pendingRequestsCount = 0;
  currentDate = new Date();
  searchQuery = '';

  ngOnInit(): void {
    this.checkScreenSize();
    // Ouvrir le sidebar par défaut sur desktop/tablette
    if (this.isDesktop) {
      this.sidebarOpen = true;
    }
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
    // Load pending sellers count
    this.userService.getPendingSellers().subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingSellersCount = response.count || response.data?.length || 0;
        }
      }
    });

    // Load pending properties count
    // On compte uniquement les biens qui sont vraiment en attente de validation
    // C'est-à-dire ceux qui ont status='pending_verification' ET is_verified=false
    this.propertyService.getProperties({ status: 'pending_verification', is_verified: false, per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          // Handle paginated response
          if (response.data?.total !== undefined) {
            this.pendingPropertiesCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            // Filtrer pour ne garder que ceux vraiment en attente (non vérifiés)
            this.pendingPropertiesCount = response.data.filter((p: any) => {
              return p.status === 'pending_verification' && p.is_verified === false;
            }).length;
          } else if (response.data?.data) {
            this.pendingPropertiesCount = response.data.data.filter((p: any) => {
              return p.status === 'pending_verification' && p.is_verified === false;
            }).length;
          } else {
            this.pendingPropertiesCount = 0;
          }
        }
      }
    });

    // Load pending requests count
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

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
    // Si on passe en mode mobile, fermer le sidebar
    if (!this.isDesktop) {
      this.sidebarOpen = false;
    } else if (this.isDesktop && !this.sidebarOpen) {
      // Si on passe en mode desktop et que le sidebar n'est pas ouvert, l'ouvrir
      this.sidebarOpen = true;
    }
  }

  private checkScreenSize(): void {
    this.isDesktop = window.innerWidth >= 768;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile(): void {
    // Fermer le sidebar sur mobile après navigation ou clic sur backdrop
    if (!this.isDesktop) {
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

