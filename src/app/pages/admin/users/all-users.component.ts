import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.sass'
})
export class AllUsersComponent implements OnInit {
  private userService = inject(UserService);
  
  // Expose Math pour l'utiliser dans le template
  Math = Math;

  users: any[] = [];
  loading = false;
  showModal = false;
  editingUser: any = null;
  filters = {
    role: '',
    verification_status: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15
  };
  currentPage = 1;
  totalPages = 1;
  total = 0;

  // Form data
  userForm: {
    first_name: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    role: 'admin' | 'vendeur' | 'acheteur';
    verification_status: 'pending' | 'verified' | 'rejected';
  } = {
    first_name: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: 'vendeur',
    verification_status: 'pending'
  };

  error: string = '';
  success: string = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const params = {
      ...this.filters,
      page: this.currentPage
    };
    
    this.userService.getUsers(params).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.data) {
            this.users = response.data.data;
            this.currentPage = response.data.current_page || 1;
            this.totalPages = response.data.last_page || 1;
            this.total = response.data.total || 0;
          } else {
            this.users = response.data || [];
            this.currentPage = 1;
            this.totalPages = 1;
            this.total = this.users.length;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  resetFilters(): void {
    this.filters = {
      role: '',
      verification_status: '',
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15
    };
    this.currentPage = 1;
    this.loadUsers();
  }

  openAddModal(): void {
    this.editingUser = null;
    this.userForm = {
      first_name: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      role: 'vendeur',
      verification_status: 'pending'
    };
    this.error = '';
    this.success = '';
    this.showModal = true;
  }

  openEditModal(user: any): void {
    this.editingUser = user;
      // Extraire le rôle depuis roles array ou utiliser role direct
      let userRole = 'vendeur';
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        userRole = user.roles[0].name || user.roles[0];
      } else if (user.role) {
        userRole = user.role;
      }
      
      this.userForm = {
        first_name: user.first_name || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        password_confirmation: '',
        role: userRole as 'admin' | 'vendeur' | 'acheteur',
        verification_status: user.verification_status || 'pending'
      };
    this.error = '';
    this.success = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = null;
    this.error = '';
    this.success = '';
  }

  saveUser(): void {
    this.error = '';
    this.success = '';

    // Validation
    if (!this.userForm.first_name || !this.userForm.name || !this.userForm.email) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (this.editingUser) {
      // Update user
      const updateData: any = {
        first_name: this.userForm.first_name,
        name: this.userForm.name,
        email: this.userForm.email,
        phone: this.userForm.phone,
        role: this.userForm.role,
        verification_status: this.userForm.verification_status
      };

      // Only include password if provided
      if (this.userForm.password) {
        if (this.userForm.password !== this.userForm.password_confirmation) {
          this.error = 'Les mots de passe ne correspondent pas';
          return;
        }
        updateData.password = this.userForm.password;
        updateData.password_confirmation = this.userForm.password_confirmation;
      }

      this.userService.updateUser(this.editingUser.id, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.success = 'Utilisateur mis à jour avec succès';
            this.loadUsers();
            setTimeout(() => {
              this.closeModal();
            }, 1500);
          } else {
            this.error = response.message || 'Erreur lors de la mise à jour';
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la mise à jour';
          if (err.error?.errors) {
            const errors = Object.values(err.error.errors).flat();
            this.error = errors.join(', ');
          }
        }
      });
    } else {
      // Create user
      if (!this.userForm.password || this.userForm.password !== this.userForm.password_confirmation) {
        this.error = 'Veuillez saisir un mot de passe valide';
        return;
      }

      this.userService.createUser(this.userForm).subscribe({
        next: (response) => {
          if (response.success) {
            this.success = 'Utilisateur créé avec succès';
            this.loadUsers();
            setTimeout(() => {
              this.closeModal();
            }, 1500);
          } else {
            this.error = response.message || 'Erreur lors de la création';
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la création';
          if (err.error?.errors) {
            const errors = Object.values(err.error.errors).flat();
            this.error = errors.join(', ');
          }
        }
      });
    }
  }

  deleteUser(user: any): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.first_name} ${user.name} ?`)) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
        } else {
          alert(response.message || 'Erreur lors de la suppression');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors de la suppression');
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  getRoleLabel(role: string | any): string {
    // Si role est un tableau (roles), extraire le premier rôle
    let roleName = role;
    if (Array.isArray(role) && role.length > 0) {
      roleName = role[0].name || role[0];
    } else if (role && typeof role === 'object' && role.name) {
      roleName = role.name;
    }
    
    const roles: any = {
      'admin': 'Administrateur',
      'vendeur': 'Vendeur',
      'acheteur': 'Acheteur'
    };
    return roles[roleName] || roleName || 'Non défini';
  }

  getStatusLabel(status: string): string {
    const statuses: any = {
      'pending': 'En attente',
      'verified': 'Vérifié',
      'rejected': 'Rejeté'
    };
    return statuses[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  }
}

