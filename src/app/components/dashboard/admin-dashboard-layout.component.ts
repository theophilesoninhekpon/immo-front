import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { PropertyService } from '../../services/property.service';

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
  
  currentUser$ = this.authService.currentUser$;
  sidebarOpen = true;
  
  // Quick stats
  pendingSellersCount = 0;
  pendingPropertiesCount = 0;
  currentDate = new Date();
  searchQuery = '';

  ngOnInit(): void {
    this.loadQuickStats();
    // Update date every minute
    setInterval(() => {
      this.currentDate = new Date();
    }, 60000);
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
    this.propertyService.getProperties({ status: 'pending_verification', per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingPropertiesCount = response.data?.total || response.data?.data?.length || 0;
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

