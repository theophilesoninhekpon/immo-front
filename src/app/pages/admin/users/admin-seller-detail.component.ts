import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { MediaService } from '../../../services/media.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-seller-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-seller-detail.component.html'
})
export class AdminSellerDetailComponent implements OnInit {
  private userService = inject(UserService);
  private mediaService = inject(MediaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  seller: any = null;
  documents: any[] = [];
  loading = false;
  
  // Vérification du vendeur
  verifyingUser = false;
  rejectingUser = false;
  rejectionReason = '';
  
  // Vérification des documents
  verifyingDocumentId: number | null = null;
  rejectingDocumentId: number | null = null;
  documentRejectionReason = '';

  ngOnInit(): void {
    const sellerId = this.route.snapshot.paramMap.get('id');
    if (sellerId) {
      this.loadSeller(sellerId);
      this.loadDocuments(sellerId);
    }
  }

  loadSeller(id: string): void {
    this.loading = true;
    this.userService.getUser(parseInt(id)).subscribe({
      next: (response) => {
        if (response.success) {
          this.seller = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadDocuments(userId: string): void {
    this.userService.getUserDocuments(parseInt(userId)).subscribe({
      next: (response) => {
        if (response.success) {
          this.documents = response.data || [];
        }
      }
    });
  }

  verifyUser(): void {
    if (!this.seller?.id) return;
    
    if (!confirm('Êtes-vous sûr de vouloir vérifier ce vendeur ? Tous ses documents doivent être vérifiés.')) {
      return;
    }

    this.verifyingUser = true;
    this.userService.verifyUser(this.seller.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadSeller(this.seller.id.toString());
          alert('Vendeur vérifié avec succès');
        }
        this.verifyingUser = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors de la vérification du vendeur');
        this.verifyingUser = false;
      }
    });
  }

  rejectUserPrompt(): void {
    this.rejectingUser = true;
    this.rejectionReason = '';
  }

  cancelReject(): void {
    this.rejectingUser = false;
    this.rejectionReason = '';
  }

  confirmRejectUser(): void {
    if (!this.seller?.id || !this.rejectionReason.trim()) {
      alert('Veuillez fournir une raison de rejet');
      return;
    }

    this.userService.rejectUser(this.seller.id, this.rejectionReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadSeller(this.seller.id.toString());
          this.cancelReject();
          alert('Vendeur rejeté');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors du rejet du vendeur');
      }
    });
  }

  verifyDocument(documentId: number): void {
    if (!this.seller?.id) return;

    this.verifyingDocumentId = documentId;
    this.userService.verifyUserDocument(this.seller.id, documentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadDocuments(this.seller.id.toString());
          this.loadSeller(this.seller.id.toString());
          this.verifyingDocumentId = null;
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors de la vérification du document');
        this.verifyingDocumentId = null;
      }
    });
  }

  rejectDocumentPrompt(documentId: number): void {
    this.rejectingDocumentId = documentId;
    this.documentRejectionReason = '';
  }

  cancelRejectDocument(): void {
    this.rejectingDocumentId = null;
    this.documentRejectionReason = '';
  }

  confirmRejectDocument(): void {
    if (!this.seller?.id || !this.rejectingDocumentId || !this.documentRejectionReason.trim()) {
      alert('Veuillez fournir une raison de rejet');
      return;
    }

    this.userService.rejectUserDocument(this.seller.id, this.rejectingDocumentId, this.documentRejectionReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadDocuments(this.seller.id.toString());
          this.loadSeller(this.seller.id.toString());
          this.cancelRejectDocument();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors du rejet du document');
      }
    });
  }

  getDocumentUrl(document: any): string {
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/storage/${document.file_path}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'verified': 'Vérifié',
      'rejected': 'Rejeté',
      'missing': 'Manquant'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'missing': 'bg-slate-100 text-slate-800'
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  }

  getVerificationStatusLabel(): string {
    if (!this.seller) return 'Non vérifié';
    const status = this.seller.verification_status;
    const labels: { [key: string]: string } = {
      'pending': 'En attente de vérification',
      'verified': 'Vérifié',
      'rejected': 'Rejeté'
    };
    return labels[status] || 'Non vérifié';
  }

  getVerificationStatusClass(): string {
    if (!this.seller) return 'bg-slate-100 text-slate-800';
    const status = this.seller.verification_status;
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  }

  hasPendingDocuments(): boolean {
    return this.documents.some(doc => doc.status === 'pending' || doc.is_verified === false);
  }

  allDocumentsVerified(): boolean {
    return this.documents.length > 0 && this.documents.every(doc => doc.is_verified === true);
  }

  getPendingDocumentsCount(): number {
    return this.documents.filter(doc => doc.status === 'pending' || doc.is_verified === false).length;
  }
}

