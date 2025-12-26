import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { ThreatModelService, ThreatModel } from '../../services/threat-model.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-threat-models',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-threat-models.component.html',
  styleUrl: './admin-threat-models.component.css'
})
export class AdminThreatModelsComponent implements OnInit {
  private threatModelService = inject(ThreatModelService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  
  currentUser$ = this.authService.currentUser$;

  threatModels: ThreatModel[] = [];
  selectedThreatModel: ThreatModel | null = null;
  showEditModal = false;
  showAddModal = false;
  loading = false;
  selectedThreatModelIds: Set<string> = new Set();
  showDeleteConfirmModal = false;
  isDeleting = false;
  showPapersUsingThreatModelModal = false;
  papersUsingThreatModel: Array<{ _id: string; title: string }> = [];
  threatModelToDelete: ThreatModel | null = null;

  // Form fields
  threatModelName = '';
  threatModelDisplayName = '';
  threatModelDescription = '';
  threatModelCategory: 'Vulnerability' | 'Attack' | 'Privacy' | 'Security' | 'Other' = 'Security';

  categories: Array<'Vulnerability' | 'Attack' | 'Privacy' | 'Security' | 'Other'> = [
    'Vulnerability',
    'Attack',
    'Privacy',
    'Security',
    'Other'
  ];

  ngOnInit() {
    this.loadThreatModels();
  }

  loadThreatModels() {
    this.threatModelService.getThreatModels().subscribe({
      next: (response) => {
        this.threatModels = response.threatModels;
      },
      error: (err) => {
        console.error('Failed to load threat models:', err);
        this.toastr.error('Failed to load threat models');
      }
    });
  }

  openAddModal() {
    this.threatModelName = '';
    this.threatModelDisplayName = '';
    this.threatModelDescription = '';
    this.threatModelCategory = 'Security';
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  openEditModal(threatModel: ThreatModel) {
    this.selectedThreatModel = threatModel;
    this.threatModelName = threatModel.name;
    this.threatModelDisplayName = threatModel.displayName;
    this.threatModelDescription = threatModel.description || '';
    this.threatModelCategory = threatModel.category || 'Security';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedThreatModel = null;
  }

  addThreatModel() {
    if (!this.threatModelName.trim()) {
      this.toastr.error('Threat model name is required');
      return;
    }

    this.loading = true;
    const threatModelData = {
      name: this.threatModelName.trim(),
      displayName: this.threatModelDisplayName.trim() || this.threatModelName.trim(),
      description: this.threatModelDescription.trim(),
      category: this.threatModelCategory
    };

    this.threatModelService.createThreatModel(threatModelData).subscribe({
      next: () => {
        this.loadThreatModels();
        this.closeAddModal();
        this.loading = false;
        this.toastr.success('Threat model created successfully');
      },
      error: (err) => {
        console.error('Failed to create threat model:', err);
        this.toastr.error(err.error?.message || 'Failed to create threat model');
        this.loading = false;
      }
    });
  }

  updateThreatModel() {
    if (!this.selectedThreatModel || !this.threatModelDisplayName.trim()) {
      this.toastr.error('Display name is required');
      return;
    }

    this.loading = true;
    const threatModelData = {
      displayName: this.threatModelDisplayName.trim(),
      description: this.threatModelDescription.trim(),
      category: this.threatModelCategory
    };

    this.threatModelService.updateThreatModel(this.selectedThreatModel._id, threatModelData).subscribe({
      next: () => {
        this.loadThreatModels();
        this.closeEditModal();
        this.loading = false;
        this.toastr.success('Threat model updated successfully');
      },
      error: (err) => {
        console.error('Failed to update threat model:', err);
        this.toastr.error(err.error?.message || 'Failed to update threat model');
        this.loading = false;
      }
    });
  }

  deleteThreatModel(threatModel: ThreatModel) {
    // Try to delete - backend will return papers using this threat model if any
    this.threatModelService.deleteThreatModel(threatModel._id).subscribe({
      next: () => {
        this.loadThreatModels();
        this.toastr.success('Threat model deleted successfully');
      },
      error: (err) => {
        console.error('Failed to delete threat model:', err);
        if (err.status === 400 && err.error?.papersUsingThreatModel && err.error.papersUsingThreatModel.length > 0) {
          // Show modal with papers using this threat model
          this.threatModelToDelete = threatModel;
          this.papersUsingThreatModel = err.error.papersUsingThreatModel;
          this.showPapersUsingThreatModelModal = true;
        } else {
          this.toastr.error(err.error?.message || 'Failed to delete threat model');
        }
      }
    });
  }

  closePapersUsingThreatModelModal() {
    this.showPapersUsingThreatModelModal = false;
    this.papersUsingThreatModel = [];
    this.threatModelToDelete = null;
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if logout fails, clear local state and redirect
        this.router.navigate(['/login']);
      }
    });
  }

  toggleThreatModelSelection(threatModelId: string) {
    if (this.selectedThreatModelIds.has(threatModelId)) {
      this.selectedThreatModelIds.delete(threatModelId);
    } else {
      this.selectedThreatModelIds.add(threatModelId);
    }
  }

  isThreatModelSelected(threatModelId: string): boolean {
    return this.selectedThreatModelIds.has(threatModelId);
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedThreatModelIds.clear();
    } else {
      this.selectedThreatModelIds.clear();
      this.threatModels.forEach(threatModel => {
        this.selectedThreatModelIds.add(threatModel._id);
      });
    }
  }

  isAllSelected(): boolean {
    if (this.threatModels.length === 0) return false;
    return this.threatModels.every(threatModel => this.selectedThreatModelIds.has(threatModel._id));
  }

  isSomeSelected(): boolean {
    return this.selectedThreatModelIds.size > 0 && !this.isAllSelected();
  }

  getSelectedCount(): number {
    return this.selectedThreatModelIds.size;
  }

  openDeleteConfirmModal() {
    if (this.selectedThreatModelIds.size === 0) return;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
  }

  confirmBulkDelete() {
    if (this.selectedThreatModelIds.size === 0 || this.isDeleting) return;
    
    this.isDeleting = true;
    const threatModelIds = Array.from(this.selectedThreatModelIds);
    const count = threatModelIds.length;

    const deleteObservables = threatModelIds.map(id => 
      this.threatModelService.deleteThreatModel(id)
    );

    forkJoin(deleteObservables).subscribe({
      next: () => {
        this.toastr.success(`${count} threat model${count > 1 ? 's' : ''} deleted successfully`);
        this.selectedThreatModelIds.clear();
        this.loadThreatModels();
        this.closeDeleteConfirmModal();
        this.isDeleting = false;
      },
      error: (err) => {
        console.error('Failed to delete threat models:', err);
        this.toastr.error('Some threat models could not be deleted');
        this.isDeleting = false;
      }
    });
  }
}

